@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo   跨学科知识图谱智能体 - 启动脚本
echo ==========================================
echo.

REM 检查Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装Docker
    echo 请访问 https://docs.docker.com/get-docker/ 安装Docker
    pause
    exit /b 1
)

REM 检查Docker Compose
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装Docker Compose
    echo 请访问 https://docs.docker.com/compose/install/ 安装Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker 和 Docker Compose 已安装
echo.

REM 检查环境变量文件
if not exist .env (
    echo ⚠️  未找到 .env 文件，从模板创建...
    if exist env.example (
        copy env.example .env >nul
        echo ✅ 已创建 .env 文件
        echo.
        echo ⚠️  请编辑 .env 文件，填入你的 OPENAI_API_KEY
        echo    然后重新运行此脚本
        pause
        exit /b 0
    ) else (
        echo ❌ 错误: 未找到 env.example 文件
        pause
        exit /b 1
    )
)

REM 检查API Key
findstr /C:"your-openai-api-key-here" .env >nul
if %errorlevel% equ 0 (
    echo ⚠️  警告: 请在 .env 文件中设置你的 OPENAI_API_KEY
    echo    当前使用的是示例值，无法正常工作
    set /p continue="是否继续？(y/N) "
    if /i not "!continue!"=="y" (
        exit /b 0
    )
)

echo ✅ 环境配置检查完成
echo.

REM 停止旧容器
echo 🔄 停止旧容器...
docker-compose down 2>nul
echo.

REM 拉取镜像
echo 📦 拉取基础镜像...
docker-compose pull neo4j redis
echo.

REM 构建镜像
echo 🔨 构建应用镜像...
docker-compose build
echo.

REM 启动服务
echo 🚀 启动所有服务...
docker-compose up -d
echo.

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 5 /nobreak >nul

REM 检查服务状态
echo.
echo 📊 服务状态:
docker-compose ps
echo.

REM 等待后端健康检查
echo ⏳ 等待后端服务就绪...
set max_attempts=30
set attempt=0

:wait_loop
if !attempt! geq !max_attempts! goto timeout
curl -s http://localhost:8000/health >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ 后端服务已就绪
    goto success
)
set /a attempt+=1
echo|set /p=.
timeout /t 2 /nobreak >nul
goto wait_loop

:timeout
echo.
echo ⚠️  警告: 后端服务启动超时，请检查日志
echo    运行: docker-compose logs backend
goto end

:success
echo.
echo.
echo ==========================================
echo   🎉 启动成功！
echo ==========================================
echo.
echo 📱 访问地址:
echo    前端界面:    http://localhost:3000
echo    API文档:     http://localhost:8000/docs
echo    Neo4j浏览器: http://localhost:7474
echo.
echo 📝 常用命令:
echo    查看日志:    docker-compose logs -f
echo    停止服务:    docker-compose down
echo    重启服务:    docker-compose restart
echo.
echo 💡 提示: 首次生成图谱可能需要30-60秒
echo ==========================================

:end
pause

