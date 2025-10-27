#!/bin/bash
# 验证 JS SDK 构建脚本

set -e  # 遇到错误立即退出

echo "🔍 验证 OperRouter JavaScript SDK"
echo "=================================="
echo ""

# 检查依赖
echo "1️⃣  检查 npm 依赖..."
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules 不存在，请先运行 npm install"
  exit 1
fi
echo "✅ 依赖已安装"
echo ""

# 清理并重新编译
echo "2️⃣  清理并重新编译..."
npm run clean > /dev/null 2>&1
npm run build
if [ $? -eq 0 ]; then
  echo "✅ 编译成功"
else
  echo "❌ 编译失败"
  exit 1
fi
echo ""

# 检查输出文件
echo "3️⃣  检查编译输出..."
EXPECTED_FILES=(
  "dist/index.js"
  "dist/index.d.ts"
  "dist/types.js"
  "dist/types.d.ts"
  "dist/http-client.js"
  "dist/http-client.d.ts"
  "dist/grpc-client.js"
  "dist/grpc-client.d.ts"
)

for file in "${EXPECTED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (缺失)"
    exit 1
  fi
done
echo ""

# 统计代码
echo "4️⃣  代码统计..."
SRC_LINES=$(find src -name "*.ts" -not -path "*/gen/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
EXAMPLE_LINES=$(find examples -name "*.ts" -exec wc -l {} + | tail -1 | awk '{print $1}')
echo "  📝 源代码: $SRC_LINES 行"
echo "  📚 示例代码: $EXAMPLE_LINES 行"
echo ""

# 检查文档
echo "5️⃣  检查文档..."
DOCS=(
  "README.md"
  "CHANGELOG.md"
  "PROJECT_SUMMARY.md"
  "package.json"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc (缺失)"
  fi
done
echo ""

# 验证导出
echo "6️⃣  验证导出..."
if grep -q "export { HTTPClient }" src/index.ts; then
  echo "  ✅ HTTPClient 已导出"
fi
if grep -q "export { GRPCWebClient }" src/index.ts; then
  echo "  ✅ GRPCWebClient 已导出"
fi
echo ""

# 总结
echo "=================================="
echo "🎉 验证完成！"
echo ""
echo "📦 包信息:"
PKG_NAME=$(grep '"name"' package.json | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
PKG_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
echo "  名称: $PKG_NAME"
echo "  版本: $PKG_VERSION"
echo ""
echo "🚀 准备发布到 NPM:"
echo "  npm publish"
echo ""
echo "📖 查看文档:"
echo "  cat README.md"
echo ""
