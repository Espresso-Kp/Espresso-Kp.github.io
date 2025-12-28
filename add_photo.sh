#!/bin/bash

# 照片快速添加脚本
# 用法: ./add_photo.sh <分类> <图片文件名> [标题] [额外标签]
# 示例: ./add_photo.sh nature sunset.jpg "美丽的日落" "landscape,golden_hour"

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -lt 2 ]; then
    echo -e "${RED}错误: 参数不足${NC}"
    echo "用法: $0 <分类> <图片文件名> [标题] [额外标签]"
    echo ""
    echo "示例:"
    echo "  $0 nature sunset.jpg"
    echo "  $0 city street.jpg \"东京街头\""
    echo "  $0 nature mountain.jpg \"雪山\" \"winter,landscape\""
    exit 1
fi

CATEGORY=$1
IMAGE_FILE=$2
TITLE=${3:-""}
EXTRA_TAGS=${4:-""}

# 验证分类
VALID_CATEGORIES=("nature" "city" "people" "misc")
if [[ ! " ${VALID_CATEGORIES[@]} " =~ " ${CATEGORY} " ]]; then
    echo -e "${YELLOW}警告: 分类 '$CATEGORY' 不在常用分类中${NC}"
    echo "常用分类: ${VALID_CATEGORIES[@]}"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查图片文件是否存在
IMAGE_PATH="assets/images/${CATEGORY}/${IMAGE_FILE}"
if [ ! -f "$IMAGE_PATH" ]; then
    echo -e "${RED}错误: 图片文件不存在: $IMAGE_PATH${NC}"
    echo "请先将图片复制到 assets/images/${CATEGORY}/ 目录"
    exit 1
fi

# 查找下一个可用的 post 编号
CONTENT_DIR="content/misc/${CATEGORY}"
mkdir -p "$CONTENT_DIR"

MAX_NUM=0
for file in "$CONTENT_DIR"/post-*.md; do
    if [ -f "$file" ]; then
        NUM=$(basename "$file" | sed 's/post-\([0-9]*\)\.md/\1/')
        if [ "$NUM" -gt "$MAX_NUM" ]; then
            MAX_NUM=$NUM
        fi
    fi
done

NEXT_NUM=$((MAX_NUM + 1))
POST_FILE="$CONTENT_DIR/post-${NEXT_NUM}.md"

# 构建标签列表
TAGS="  - archive # all posts\n  - ${CATEGORY}"
if [ -n "$EXTRA_TAGS" ]; then
    IFS=',' read -ra TAG_ARRAY <<< "$EXTRA_TAGS"
    for tag in "${TAG_ARRAY[@]}"; do
        TAGS="${TAGS}\n  - $(echo $tag | xargs)" # xargs 用于去除空格
    done
fi

# 创建 markdown 文件
cat > "$POST_FILE" << EOF
---
weight: 1
images:
  - ${CATEGORY}/${IMAGE_FILE}
title: ${TITLE}
tags:
${TAGS}
---

EOF

echo -e "${GREEN}✅ 成功创建照片文章！${NC}"
echo ""
echo "📄 文件位置: $POST_FILE"
echo "🖼️  图片路径: $IMAGE_PATH"
echo "🏷️  分类: $CATEGORY"
if [ -n "$TITLE" ]; then
    echo "📝 标题: $TITLE"
fi
echo ""
echo "下一步:"
echo "  1. 预览: hugo server -D"
echo "  2. 访问: http://localhost:1313"
echo "  3. 发布: git add . && git commit -m 'Add new photo' && git push"
