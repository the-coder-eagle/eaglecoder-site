#!/bin/bash
# ============================================================
# 本地一键部署脚本 — eaglecoder.cn
# 用法：bash scripts/deploy.sh  或  npm run deploy
# ============================================================
set -e

REMOTE_HOST="43.135.51.209"
REMOTE_PORT="22222"
REMOTE_USER="root"
REMOTE_PATH="/www/wwwroot/eaglecoder.cn/"
KEY_FILE="$HOME/.ssh/deploy_rsa"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 开始部署到 eaglecoder.cn${NC}"
echo "================================"

# ---- 1. 检查密钥 ----
if [ ! -f "$KEY_FILE" ]; then
  echo -e "${RED}❌ 未找到部署密钥：$KEY_FILE${NC}"
  echo ""
  echo "   请先从服务器拉取密钥："
  echo "   scp -P $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST:/root/.ssh/deploy_rsa ~/.ssh/deploy_rsa"
  echo "   chmod 600 ~/.ssh/deploy_rsa"
  exit 1
fi

SSH_CMD="ssh -p $REMOTE_PORT -i $KEY_FILE -o StrictHostKeyChecking=accept-new"

# ---- 2. 测试连接 ----
echo -e "${YELLOW}📡 测试服务器连接...${NC}"
if ! $SSH_CMD $REMOTE_USER@$REMOTE_HOST "echo ok" > /dev/null 2>&1; then
  echo -e "${RED}❌ 无法连接到服务器${NC}"
  exit 1
fi
echo -e "${GREEN}✅ 服务器连接正常${NC}"

# ---- 3. 构建 ----
echo ""
echo -e "${YELLOW}🔨 构建中...${NC}"
npm run build
echo -e "${GREEN}✅ 构建完成${NC}"

# ---- 4. 部署 ----
echo ""
echo -e "${YELLOW}📤 上传到服务器...${NC}"
rsync -avz --delete \
  -e "ssh -p $REMOTE_PORT -i $KEY_FILE -o StrictHostKeyChecking=accept-new" \
  dist/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "   https://eaglecoder.cn"

# ---- 5. 刷新 Pagefind 索引（可选，build 已做）----
echo ""
echo -e "${GREEN}🎉 全部完成，网站已更新${NC}"
