# 📸 Island Gallery - 照片管理指南

简单易用的照片添加、删除和发布流程。

---

## 🚀 快速开始

### 🌐 方式一：Web 界面（推荐）✨

**最简单的方式！** 使用可视化界面管理照片。

```bash
cd photo-manager
./start.sh
# 访问 http://localhost:3001
```

**功能：**
- ✅ 拖拽上传照片
- ✅ 在线编辑标题和标签
- ✅ 一键删除
- ✅ 智能搜索和过滤
- ✅ 集成 Git 操作

**详细文档：** [photo-manager/README.md](photo-manager/README.md)

---

### 📝 方式二：命令行

### 1️⃣ 添加新照片

**步骤：**

1. **放置图片文件**
   ```bash
   # 将照片复制到对应分类目录
   cp 你的照片.jpg assets/images/nature/
   # 或其他分类: city, people, film 等
   ```

2. **创建文章文件**
   ```bash
   # 使用辅助脚本快速创建（推荐）
   ./add_photo.sh nature 你的照片.jpg
   
   # 或手动创建文件 content/misc/nature/post-XX.md
   ```

3. **预览效果**
   ```bash
   hugo server -D
   # 访问 http://localhost:1313 查看效果
   ```

4. **发布上线**
   ```bash
   git add .
   git commit -m "Add new photos"
   git push origin main
   # GitHub Actions 会自动部署！
   ```

---

### 2️⃣ 删除照片

**步骤：**

1. **删除文章文件**
   ```bash
   rm content/misc/nature/post-XX.md
   ```

2. **（可选）删除图片文件**
   ```bash
   # 如果不再需要这张图片
   rm assets/images/nature/照片名.jpg
   ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "Remove photos"
   git push origin main
   ```

---

### 3️⃣ 修改照片信息

编辑对应的 markdown 文件：

```yaml
---
weight: 1          # 排序权重，数字越小越靠前
images:
  - nature/DSC03174.jpg  # 图片路径
title: 我的标题    # 可选：照片标题
tags:
  - archive       # 必须：所有照片都要有
  - nature        # 分类标签
  - city          # 可以有多个标签
---
```

---

## 📁 目录结构

```
Espresso-Kp.github.io/
├── assets/images/          # 📷 存放所有图片
│   ├── nature/            # 自然风景
│   ├── city/              # 城市街拍
│   ├── people/            # 人物肖像
│   └── ...
├── content/misc/nature/   # 📝 照片文章（markdown）
│   ├── post-1.md
│   ├── post-2.md
│   └── ...
└── add_photo.sh           # 🛠️ 快速添加照片脚本
```

---

## 🛠️ 辅助脚本使用

### `add_photo.sh` - 快速添加照片

**用法：**
```bash
./add_photo.sh <分类> <图片文件名> [标题] [额外标签]
```

**示例：**
```bash
# 基础用法
./add_photo.sh nature sunset.jpg

# 带标题
./add_photo.sh city street.jpg "东京街头"

# 带多个标签
./add_photo.sh nature mountain.jpg "雪山" "winter,landscape"
```

脚本会自动：
- ✅ 找到下一个可用的 post 编号
- ✅ 创建格式正确的 markdown 文件
- ✅ 设置正确的图片路径和标签

---

## 🏷️ 标签说明

### 必需标签
- `archive` - 所有照片都必须有这个标签

### 分类标签（选一个或多个）
- `nature` - 自然风景
- `city` - 城市街拍
- `people` - 人物肖像
- `film` - 胶片摄影（已移除）

### 自定义标签
可以添加任何自定义标签，如：
- `winter`, `summer`, `spring`, `fall` - 季节
- `landscape`, `portrait`, `macro` - 摄影类型
- `travel`, `daily` - 场景类型

---

## 🌐 发布流程

### 自动部署（推荐）✨

只需推送到 GitHub：
```bash
git add .
git commit -m "Update photos"
git push origin main
```

GitHub Actions 会自动：
1. 构建 Hugo 网站
2. 优化图片
3. 部署到 GitHub Pages

**查看部署状态：**
👉 https://github.com/Espresso-Kp/Espresso-Kp.github.io/actions

**访问网站：**
👉 https://Espresso-Kp.github.io/

---

## ⚙️ 配置说明

### 修改网站配置

编辑 `config.yaml`：

```yaml
# 网站基本信息
title: Island Gallery
author: Kaipeng Wang

# 导航菜单
menu:
  main:
    - name: misc
      url: /misc/
    - name: people
      url: /tags/people/
    - name: city
      url: /tags/city/
    - name: archive
      url: /tags/archive/
    - name: about
      url: /about/

# 图片列数配置
params:
  portfolio:
    columns:
      desktop:
        nature: 4    # nature 分类显示 4 列
        misc: 3      # misc 分类显示 3 列
        archive: 6   # archive 显示 6 列
```

---

## 🐛 常见问题

### Q: 本地预览正常，但部署后图片不显示？
**A:** 确保：
1. 图片文件已提交到 Git：`git add assets/images/`
2. `layouts/` 目录已提交（包含自定义模板）
3. 检查 GitHub Actions 构建日志

### Q: 如何批量添加照片？
**A:** 使用循环：
```bash
for img in *.jpg; do
  ./add_photo.sh nature "$img"
done
```

### Q: 如何修改照片顺序？
**A:** 修改文章的 `weight` 值，数字越小越靠前。

### Q: 图片太大，加载慢怎么办？
**A:** Hugo 会自动优化图片。如果还是太大，可以先压缩：
```bash
# 使用 ImageMagick 压缩
mogrify -quality 85 -resize 3000x3000\> *.jpg
```

---

## 📝 文章模板

```yaml
---
weight: 1                    # 排序权重
images:
  - nature/your-photo.jpg   # 图片路径（相对于 assets/images/）
title: 可选标题              # 留空则不显示标题
tags:
  - archive                 # 必需
  - nature                  # 分类
  - landscape               # 自定义标签（可选）
---
```

---

## 🎯 最佳实践

1. **图片命名**：使用有意义的文件名，如 `sunset_beach_2024.jpg`
2. **图片尺寸**：建议长边不超过 3000px
3. **文件格式**：推荐 `.jpg`，Hugo 会自动转换为 WebP
4. **定期清理**：删除不再使用的图片文件
5. **提交信息**：使用清晰的 commit message

---

## 🔗 相关链接

- **网站地址**: https://Espresso-Kp.github.io/
- **GitHub 仓库**: https://github.com/Espresso-Kp/Espresso-Kp.github.io
- **Hugo 文档**: https://gohugo.io/documentation/
- **主题文档**: https://github.com/boratanrikulu/eternity

---

**享受摄影，享受分享！** 📸✨
