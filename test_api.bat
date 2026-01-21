@echo off
chcp 65001 >nul

echo ==========================================
echo   API功能测试
echo ==========================================
echo.

set API_BASE=http://localhost:8000

REM 测试1: 健康检查
echo 测试 1: 健康检查
echo ----------------------------------------
curl -s %API_BASE%/health
echo.
echo.

REM 测试2: 生成知识图谱
echo 测试 2: 生成知识图谱（概念：熵）
echo ----------------------------------------
echo 正在生成图谱，请稍候（30-60秒）...
curl -s -X POST %API_BASE%/api/graph/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"concept\": \"熵\", \"enable_validation\": true}" ^
  -o graph_result.json

echo ✅ 图谱生成完成
echo.

REM 测试3: 列出所有图谱
echo 测试 3: 列出所有图谱
echo ----------------------------------------
curl -s %API_BASE%/api/graphs
echo.
echo.

echo ==========================================
echo   测试完成
echo ==========================================
echo.
echo 详细结果已保存到: graph_result.json
echo.

pause

