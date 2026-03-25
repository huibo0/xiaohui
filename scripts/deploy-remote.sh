#!/bin/bash
# ========================================
# 小惠 - VPS 远程部署脚本
# 放在 VPS 上，由本地脚本通过 SSH 调用
# ========================================

set -e

APP_DIR="/root/xiaohui"
APP_NAME="xiaohui"

echo "🌷 小惠部署开始..."
echo "================================"

cd "$APP_DIR"

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 安装依赖（有新包时才实际安装）
echo "📦 检查依赖..."
npm install --production=false 2>&1 | tail -5

# 3. 构建
echo "🔨 构建中..."
npm run build 2>&1 | tail -10

BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  echo "❌ 构建失败！退出部署"
  exit 1
fi

# 4. 重启 PM2
echo "🔄 重启服务..."
if pm2 list | grep -q "$APP_NAME"; then
  pm2 restart "$APP_NAME"
else
  pm2 start npm --name "$APP_NAME" -- start
  pm2 save
fi

# 5. 等待启动，检查健康
echo "⏳ 等待服务启动..."
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 部署成功！服务正常运行"
  echo "🌐 https://xiaohui.sdfeer.site"
else
  echo "⚠️  服务返回 HTTP $HTTP_CODE，请检查日志："
  echo "   pm2 logs $APP_NAME --lines 20"
fi

echo "================================"
echo "🌷 部署完成 $(date '+%Y-%m-%d %H:%M:%S')"
