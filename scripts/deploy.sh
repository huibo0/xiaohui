#!/bin/bash
# ========================================
# 小惠 - 一键部署脚本（本地运行）
# 用法: ./scripts/deploy.sh
#
# 首次使用前请先设置 SSH 免密登录:
#   ssh-copy-id root@108.160.136.103
# ========================================

set -e

VPS_HOST="108.160.136.103"
VPS_USER="root"
APP_DIR="/root/xiaohui"
REMOTE_SCRIPT="$APP_DIR/scripts/deploy-remote.sh"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PINK='\033[0;35m'
NC='\033[0m'

echo -e "${PINK}🌷 小惠一键部署${NC}"
echo "================================"

# 0. 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
  exit 1
fi

# 1. 本地构建检查
echo -e "${YELLOW}🔍 本地构建检查...${NC}"
npx next build 2>&1 | tail -5
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo -e "${RED}❌ 本地构建失败！请修复后再部署${NC}"
  exit 1
fi
echo -e "${GREEN}✅ 本地构建通过${NC}"

# 2. Git 提交 & 推送
echo ""
echo -e "${YELLOW}📝 检查 Git 状态...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo "检测到未提交的更改："
  git status --short
  echo ""
  read -p "输入提交信息（直接回车则用默认信息）: " COMMIT_MSG
  COMMIT_MSG=${COMMIT_MSG:-"update: $(date '+%m-%d %H:%M')"}

  git add -A
  git commit -m "$COMMIT_MSG"
  echo -e "${GREEN}✅ 已提交: $COMMIT_MSG${NC}"
fi

echo -e "${YELLOW}📤 推送到 GitHub...${NC}"
git push origin master
echo -e "${GREEN}✅ 推送完成${NC}"

# 3. SSH 到 VPS 执行远程部署
echo ""
echo -e "${YELLOW}🚀 连接 VPS 执行部署...${NC}"
ssh -o ConnectTimeout=10 "${VPS_USER}@${VPS_HOST}" "bash ${REMOTE_SCRIPT}"

SSH_EXIT=$?
if [ $SSH_EXIT -ne 0 ]; then
  echo -e "${RED}❌ VPS 部署失败（SSH 退出码: $SSH_EXIT）${NC}"
  echo "请检查："
  echo "  1. SSH 连接是否正常: ssh ${VPS_USER}@${VPS_HOST}"
  echo "  2. VPS 上脚本是否存在: ${REMOTE_SCRIPT}"
  exit 1
fi

echo ""
echo -e "${PINK}================================${NC}"
echo -e "${GREEN}🎉 全部完成！${NC}"
echo -e "${PINK}🌐 https://xiaohui.sdfeer.site${NC}"
echo -e "${PINK}================================${NC}"
