#!/bin/bash

# 照片管理系统启动脚本

set -e

cd "$(dirname "$0")"

echo "📸 Island Gallery - 照片管理系统"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请访问 https://nodejs.org/ 下载安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo "✅ 依赖安装完成"
fi

echo ""
echo "🚀 启动服务器..."
echo ""
echo "访问地址: http://localhost:3001"
echo "按 Ctrl+C 停止服务器"
echo ""

npm start
