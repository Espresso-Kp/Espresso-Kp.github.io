# 📸 Island Gallery - 照片管理系统

一个现代化的本地 Web 界面，用于管理你的 Hugo 照片网站。

![Photo Manager](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-green)

---

## ✨ 功能特性

- 📤 **拖拽上传** - 轻松上传照片
- ✏️ **在线编辑** - 编辑标题、标签和权重
- 🗑️ **快速删除** - 删除照片和文章
- 🔍 **智能搜索** - 按分类和关键词过滤
- 🎨 **现代界面** - 简洁美观的设计
- 🔄 **Git 集成** - 直接提交和推送到 GitHub
- 📱 **响应式** - 支持手机和平板

---

## 🚀 快速开始

### 1. 启动服务器

```bash
cd photo-manager
./start.sh
```

或手动启动：

```bash
cd photo-manager
npm install  # 首次运行
npm start
```

### 2. 打开浏览器

访问：**http://localhost:3001**

### 3. 开始管理照片！

---

## 📖 使用指南

### 上传照片

1. 点击 **"➕ 上传照片"** 按钮
2. 选择图片文件
3. 选择分类（Nature, City, People, Misc）
4. 填写标题和标签（可选）
5. 点击 **"上传"**

照片会自动：
- 复制到 `assets/images/分类/` 目录
- 创建对应的 markdown 文件
- 显示在照片网格中

### 编辑照片信息

1. 点击照片卡片上的 **✏️** 图标
2. 修改标题、标签或权重
3. 点击 **"保存"**

### 删除照片

1. 点击照片卡片上的 **🗑️** 图标
2. 确认删除
3. 选择是否同时删除图片文件

### 搜索和过滤

- **按分类过滤**：使用顶部的下拉菜单
- **搜索**：在搜索框输入标题或标签关键词
- **查看数量**：右上角显示当前照片总数

### Git 操作

1. 点击 **"🔄 Git 操作"** 按钮
2. **检查状态**：查看当前更改
3. **提交更改**：
   - 输入提交信息
   - 点击 **"提交"**
4. **推送到 GitHub**：
   - 点击 **"推送"**
   - GitHub Actions 会自动部署

---

## 🏗️ 项目结构

```
photo-manager/
├── server.js           # Express 后端服务器
├── package.json        # 依赖配置
├── start.sh           # 启动脚本
├── public/            # 前端文件
│   ├── index.html     # 主页面
│   ├── app.js         # JavaScript 逻辑
│   └── style.css      # 样式文件
└── README.md          # 本文档
```

---

## 🔧 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web 框架
- **Multer** - 文件上传处理

### 前端
- **原生 HTML/CSS/JavaScript** - 无框架依赖
- **现代 ES6+** - 异步操作和模块化
- **响应式设计** - 支持各种设备

---

## 📝 API 接口

### 获取所有照片
```
GET /api/photos
```

### 上传照片
```
POST /api/photos
Content-Type: multipart/form-data

Body:
- image: 图片文件
- category: 分类
- title: 标题（可选）
- tags: 标签（可选，逗号分隔）
```

### 更新照片信息
```
PUT /api/photos/:category/:filename
Content-Type: application/json

Body:
{
  "title": "新标题",
  "tags": ["tag1", "tag2"],
  "weight": 1
}
```

### 删除照片
```
DELETE /api/photos/:category/:filename?deleteImage=true
```

### Git 操作
```
POST /api/git/status    # 检查状态
POST /api/git/commit    # 提交更改
POST /api/git/push      # 推送到远程
```

---

## ⚙️ 配置

### 端口修改

编辑 `server.js` 第 8 行：

```javascript
const PORT = 3001;  // 改为你想要的端口
```

### 路径配置

默认配置：
- 仓库根目录：`photo-manager` 的上级目录
- 图片目录：`assets/images/`
- 内容目录：`content/misc/`

如需修改，编辑 `server.js` 第 11-13 行。

---

## 🐛 常见问题

### Q: 启动时提示 "未安装 Node.js"？
**A:** 访问 https://nodejs.org/ 下载安装 Node.js（推荐 LTS 版本）

### Q: 上传照片后看不到？
**A:** 
1. 检查浏览器控制台是否有错误
2. 确认图片格式（支持 jpg, png, gif, webp）
3. 刷新页面重新加载

### Q: Git 推送失败？
**A:**
1. 确保已配置 Git 凭据
2. 检查网络连接
3. 查看推送输出的错误信息

### Q: 如何在后台运行？
**A:** 使用 `pm2` 或 `nohup`：
```bash
npm install -g pm2
pm2 start server.js --name photo-manager
```

---

## 🎯 最佳实践

1. **定期提交**：完成一批照片上传后及时提交
2. **有意义的提交信息**：如 "Add sunset photos from Tokyo"
3. **图片优化**：上传前适当压缩图片（推荐长边 ≤ 3000px）
4. **标签规范**：使用一致的标签命名（如 landscape, portrait）
5. **备份**：重要照片保留原始文件备份

---

## 🔒 安全提示

⚠️ **注意**：此工具仅用于本地开发环境！

- 不要在公网暴露此服务器
- 不要在生产环境使用
- Git 操作需要本地已配置凭据

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- Hugo - 静态网站生成器
- Express - Node.js Web 框架
- Multer - 文件上传中间件

---

**享受便捷的照片管理体验！** 📸✨
