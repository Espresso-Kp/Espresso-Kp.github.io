---
images:
- nature/example.jpg  # 相对于 assets/images/ 目录
title: 示例标题
tags:
- nature
- archive
---

这是一个示例文章。

## 使用说明

### 图片路径格式

1. **从 assets/images/ 目录引用**（推荐）:
   ```yaml
   images:
   - nature/DSC03130.jpg
   ```

2. **从 static/ 目录引用**:
   ```yaml
   images:
   - /images/logo.jpg
   ```

### 图片处理

Hugo 会自动：
- 生成多种尺寸
- 转换为 WebP 格式
- 优化质量（75%）
- 生成响应式图片

### 添加新图片

1. 将原始图片放入 `assets/images/nature/` 等分类目录
2. 在 markdown 文件中引用：`images: [nature/你的图片.jpg]`
3. Hugo 会自动处理优化
