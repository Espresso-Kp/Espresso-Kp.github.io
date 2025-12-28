# 🚀 快速参考

## 添加照片（3步）

```bash
# 1. 复制图片
cp 照片.jpg assets/images/nature/

# 2. 创建文章
./add_photo.sh nature 照片.jpg

# 3. 发布
git add . && git commit -m "Add photos" && git push
```

## 删除照片

```bash
rm content/misc/nature/post-XX.md
git add . && git commit -m "Remove photo" && git push
```

## 本地预览

```bash
hugo server -D
# 访问 http://localhost:1313
```

## 文章模板

```yaml
---
weight: 1
images:
  - nature/photo.jpg
title: 
tags:
  - archive
  - nature
---
```

## 目录结构

```
assets/images/nature/    ← 放图片
content/misc/nature/     ← 放文章 .md
```

## 常用命令

```bash
# 批量添加
for img in *.jpg; do ./add_photo.sh nature "$img"; done

# 查看状态
git status

# 查看部署
open https://github.com/Espresso-Kp/Espresso-Kp.github.io/actions
```

---

详细文档: [README_PHOTO_MANAGEMENT.md](README_PHOTO_MANAGEMENT.md)
