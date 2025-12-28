const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const app = express();
const PORT = 3001;

// 配置
const REPO_ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(REPO_ROOT, 'assets', 'images');
const CONTENT_DIR = path.join(REPO_ROOT, 'content', 'misc');

// 中间件
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static(path.join(REPO_ROOT, 'assets')));

// 配置文件上传
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const category = req.body.category || 'nature';
        const dir = path.join(ASSETS_DIR, category);
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('只支持图片文件！'));
    }
});

// 获取所有照片
app.get('/api/photos', async (req, res) => {
    try {
        const categories = await fs.readdir(CONTENT_DIR);
        const photos = [];

        for (const category of categories) {
            const categoryPath = path.join(CONTENT_DIR, category);
            const stat = await fs.stat(categoryPath);

            if (!stat.isDirectory()) continue;

            const files = await fs.readdir(categoryPath);

            for (const file of files) {
                if (!file.endsWith('.md')) continue;

                const filePath = path.join(categoryPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const metadata = parseFrontMatter(content);

                if (metadata.images && metadata.images.length > 0) {
                    photos.push({
                        id: `${category}/${file}`,
                        category,
                        filename: file,
                        ...metadata,
                        imagePath: `/assets/images/${metadata.images[0]}`
                    });
                }
            }
        }

        res.json(photos);
    } catch (error) {
        console.error('获取照片列表失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 上传照片
app.post('/api/photos', upload.single('image'), async (req, res) => {
    try {
        const { category, title, tags, content } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: '没有上传图片' });
        }

        // 查找下一个可用的编号
        const categoryPath = path.join(CONTENT_DIR, category);
        await fs.mkdir(categoryPath, { recursive: true });

        const files = await fs.readdir(categoryPath);
        const postNumbers = files
            .filter(f => f.match(/^post-(\d+)\.md$/))
            .map(f => parseInt(f.match(/^post-(\d+)\.md$/)[1]));

        const nextNum = postNumbers.length > 0 ? Math.max(...postNumbers) + 1 : 1;
        const mdFilename = `post-${nextNum}.md`;
        const mdPath = path.join(categoryPath, mdFilename);

        // 创建 markdown 文件
        const tagList = tags ? tags.split(',').map(t => t.trim()) : [];
        const allTags = ['archive', category, ...tagList];

        const frontMatter = `---
weight: 1
images:
  - ${category}/${imageFile.filename}
title: ${title || ''}
tags:
${allTags.map(t => `  - ${t}`).join('\n')}
---

${content || ''}
`;

        await fs.writeFile(mdPath, frontMatter);

        res.json({
            success: true,
            photo: {
                id: `${category}/${mdFilename}`,
                category,
                filename: mdFilename,
                images: [`${category}/${imageFile.filename}`],
                title,
                tags: allTags,
                content,
                imagePath: `/assets/images/${category}/${imageFile.filename}`
            }
        });
    } catch (error) {
        console.error('上传照片失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 更新照片信息
app.put('/api/photos/:category/:filename', async (req, res) => {
    try {
        const { category: oldCategory, filename } = req.params;
        const { category: newCategory, title, tags, weight, content } = req.body;

        const oldMdPath = path.join(CONTENT_DIR, oldCategory, filename);
        const fileContent = await fs.readFile(oldMdPath, 'utf-8');
        const metadata = parseFrontMatter(fileContent);

        // 检查是否需要移动分类
        const categoryChanged = newCategory && newCategory !== oldCategory;

        // 更新元数据
        const updatedMetadata = {
            ...metadata,
            title: title !== undefined ? title : metadata.title,
            tags: tags !== undefined ? tags : metadata.tags,
            weight: weight !== undefined ? weight : metadata.weight,
            content: content !== undefined ? content : metadata.content
        };

        // 如果分类改变，需要移动文件和更新图片路径
        if (categoryChanged) {
            // 创建新分类目录
            const newCategoryPath = path.join(CONTENT_DIR, newCategory);
            await fs.mkdir(newCategoryPath, { recursive: true });

            // 更新图片路径
            if (metadata.images && metadata.images.length > 0) {
                const updatedImages = [];
                for (const imgPath of metadata.images) {
                    const imgFilename = path.basename(imgPath);
                    const oldImgPath = path.join(ASSETS_DIR, imgPath);
                    const newImgPath = path.join(ASSETS_DIR, newCategory, imgFilename);

                    // 移动图片文件
                    try {
                        await fs.mkdir(path.join(ASSETS_DIR, newCategory), { recursive: true });
                        await fs.rename(oldImgPath, newImgPath);
                        updatedImages.push(`${newCategory}/${imgFilename}`);
                    } catch (err) {
                        console.warn('移动图片失败:', err.message);
                        updatedImages.push(imgPath); // 保留原路径
                    }
                }
                updatedMetadata.images = updatedImages;
            }

            // 更新标签（移除旧分类，添加新分类）
            if (updatedMetadata.tags) {
                updatedMetadata.tags = updatedMetadata.tags
                    .filter(tag => tag !== oldCategory)
                    .concat(newCategory);
                // 去重
                updatedMetadata.tags = [...new Set(updatedMetadata.tags)];
            }

            // 写入新位置
            const newMdPath = path.join(CONTENT_DIR, newCategory, filename);
            const newContent = createFrontMatter(updatedMetadata);
            await fs.writeFile(newMdPath, newContent);

            // 删除旧文件
            await fs.unlink(oldMdPath);

            res.json({
                success: true,
                photo: {
                    ...updatedMetadata,
                    id: `${newCategory}/${filename}`,
                    category: newCategory
                },
                categoryChanged: true
            });
        } else {
            // 分类未改变，直接更新
            const newContent = createFrontMatter(updatedMetadata);
            await fs.writeFile(oldMdPath, newContent);

            res.json({ success: true, photo: updatedMetadata });
        }
    } catch (error) {
        console.error('更新照片失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 删除照片
app.delete('/api/photos/:category/:filename', async (req, res) => {
    try {
        const { category, filename } = req.params;
        const { deleteImage } = req.query;

        const mdPath = path.join(CONTENT_DIR, category, filename);

        // 读取图片路径
        if (deleteImage === 'true') {
            const content = await fs.readFile(mdPath, 'utf-8');
            const metadata = parseFrontMatter(content);

            if (metadata.images && metadata.images.length > 0) {
                const imagePath = path.join(ASSETS_DIR, metadata.images[0]);
                try {
                    await fs.unlink(imagePath);
                } catch (err) {
                    console.warn('删除图片文件失败:', err.message);
                }
            }
        }

        // 删除 markdown 文件
        await fs.unlink(mdPath);

        res.json({ success: true });
    } catch (error) {
        console.error('删除照片失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// Git 操作
app.post('/api/git/:action', async (req, res) => {
    try {
        const { action } = req.params;
        const { message } = req.body;

        let result = { success: true, output: '' };

        switch (action) {
            case 'status':
                try {
                    const { stdout } = await execPromise('git status --short', { cwd: REPO_ROOT });
                    result.output = stdout.trim() || '✅ 工作目录干净，没有需要提交的更改';
                    result.hasChanges = stdout.trim().length > 0;
                } catch (error) {
                    result.output = `❌ 检查状态失败: ${error.message}`;
                    result.success = false;
                }
                break;

            case 'commit':
                try {
                    // 先检查是否有更改
                    const { stdout: statusOutput } = await execPromise('git status --short', { cwd: REPO_ROOT });

                    if (!statusOutput.trim()) {
                        result.output = '⚠️ 没有需要提交的更改';
                        result.success = false;
                        break;
                    }

                    // 添加所有更改
                    await execPromise('git add .', { cwd: REPO_ROOT });

                    // 提交
                    const commitMsg = message || 'Update photos';
                    const { stdout: commitOutput } = await execPromise(`git commit -m "${commitMsg}"`, { cwd: REPO_ROOT });

                    result.output = `✅ 提交成功！\n\n${commitOutput}`;
                } catch (error) {
                    if (error.message.includes('nothing to commit')) {
                        result.output = '⚠️ 没有需要提交的更改';
                        result.success = false;
                    } else {
                        result.output = `❌ 提交失败: ${error.message}\n\n${error.stderr || ''}`;
                        result.success = false;
                    }
                }
                break;

            case 'push':
                try {
                    // 先检查是否有未推送的提交
                    const { stdout: statusOutput } = await execPromise('git status -sb', { cwd: REPO_ROOT });

                    if (statusOutput.includes('ahead 0')) {
                        result.output = '⚠️ 没有需要推送的提交';
                        result.success = false;
                        break;
                    }

                    // 推送到远程
                    const { stdout, stderr } = await execPromise('git push origin main', { cwd: REPO_ROOT });

                    result.output = `✅ 推送成功！\n\n${stdout || stderr}\n\n🚀 GitHub Actions 将自动部署网站`;
                } catch (error) {
                    if (error.message.includes('Everything up-to-date')) {
                        result.output = '✅ 远程仓库已是最新';
                    } else {
                        result.output = `❌ 推送失败: ${error.message}\n\n${error.stderr || ''}\n\n💡 提示：请检查网络连接和 Git 凭据`;
                        result.success = false;
                    }
                }
                break;

            default:
                return res.status(400).json({ error: '无效的操作' });
        }

        res.json(result);
    } catch (error) {
        console.error('Git 操作失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            output: `❌ 操作失败: ${error.message}`
        });
    }
});

// 辅助函数：解析 Front Matter
function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const yaml = match[1];
    const metadata = {};

    // 解析 weight
    const weightMatch = yaml.match(/weight:\s*(\d+)/);
    if (weightMatch) metadata.weight = parseInt(weightMatch[1]);

    // 解析 title
    const titleMatch = yaml.match(/title:\s*(.+)/);
    if (titleMatch) metadata.title = titleMatch[1].trim();

    // 解析 images
    const imagesMatch = yaml.match(/images:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (imagesMatch) {
        metadata.images = imagesMatch[1]
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\s*-\s*/, '').trim());
    }

    // 解析 tags
    const tagsMatch = yaml.match(/tags:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (tagsMatch) {
        metadata.tags = tagsMatch[1]
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\s*-\s*/, '').replace(/\s*#.*$/, '').trim());
    }

    // 解析内容（Front Matter 之后的部分）
    const contentMatch = content.match(/^---\n[\s\S]*?\n---\n+([\s\S]*)/);
    if (contentMatch) {
        metadata.content = contentMatch[1].trim();
    }

    return metadata;
}

// 辅助函数：创建 Front Matter
function createFrontMatter(metadata) {
    const { weight, images, title, tags, content } = metadata;

    return `---
weight: ${weight || 1}
images:
${images.map(img => `  - ${img}`).join('\n')}
title: ${title || ''}
tags:
${tags.map(tag => `  - ${tag}`).join('\n')}
---

${content || ''}
`;
}

app.listen(PORT, () => {
    console.log(`📸 照片管理服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 仓库路径: ${REPO_ROOT}`);
});
