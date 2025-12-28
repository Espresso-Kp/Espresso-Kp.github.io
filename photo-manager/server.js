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
        const { category, title, tags } = req.body;
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
        const { category, filename } = req.params;
        const { title, tags, weight } = req.body;
        
        const mdPath = path.join(CONTENT_DIR, category, filename);
        const content = await fs.readFile(mdPath, 'utf-8');
        const metadata = parseFrontMatter(content);

        // 更新元数据
        const updatedMetadata = {
            ...metadata,
            title: title !== undefined ? title : metadata.title,
            tags: tags !== undefined ? tags : metadata.tags,
            weight: weight !== undefined ? weight : metadata.weight
        };

        const newContent = createFrontMatter(updatedMetadata);
        await fs.writeFile(mdPath, newContent);

        res.json({ success: true, photo: updatedMetadata });
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

        let command;
        switch (action) {
            case 'status':
                command = 'git status --short';
                break;
            case 'commit':
                command = `git add . && git commit -m "${message || 'Update photos'}"`;
                break;
            case 'push':
                command = 'git push origin main';
                break;
            default:
                return res.status(400).json({ error: '无效的操作' });
        }

        const { stdout, stderr } = await execPromise(command, { cwd: REPO_ROOT });
        res.json({ success: true, output: stdout || stderr });
    } catch (error) {
        res.status(500).json({ error: error.message, output: error.stdout || error.stderr });
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

    return metadata;
}

// 辅助函数：创建 Front Matter
function createFrontMatter(metadata) {
    const { weight, images, title, tags } = metadata;
    
    return `---
weight: ${weight || 1}
images:
${images.map(img => `  - ${img}`).join('\n')}
title: ${title || ''}
tags:
${tags.map(tag => `  - ${tag}`).join('\n')}
---

`;
}

app.listen(PORT, () => {
    console.log(`📸 照片管理服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 仓库路径: ${REPO_ROOT}`);
});
