# GitHub Actions CI/CD 快速指南

## 🚀 已配置的 Workflow

项目的仓库现在有一个基本的 CI/CD workflow：`.github/workflows/main.yml`

## 📋 Workflow 功能

### 1. 构建后端 (build-backend)
- 检出代码
- 构建 Docker 镜像
- 验证构建成功

### 2. 构建前端 (build-frontend)
- 检出代码
- 安装 Node.js 依赖
- 构建生产版本
- 验证构建输出

### 3. 推送镜像 (docker-build-push)
- 仅在推送到 main 分支时运行
- 构建并推送到 GitHub Container Registry
- 镜像地址：
  - `ghcr.io/0213cc/agent-backend:latest`
  - `ghcr.io/0213cc/agent-frontend:latest`

## 🔧 触发条件

- **自动触发**：
  - Push 到 main 或 master 分支
  - 创建 Pull Request
  
- **手动触发**：
  - 进入 Actions 标签
  - 选择 "CI/CD" workflow
  - 点击 "Run workflow"

## 📦 使用步骤

### 1. 推送代码到 GitHub

```bash
# 确保用户在项目根目录
cd /home/hehe213/agent/knowledge-graph-agent

# 添加所有文件
git add .

# 提交
git commit -m "Add CI/CD workflow"

# 推送到 GitHub
git push origin main
```

### 2. 查看 Actions

1. 进入项目的 GitHub 仓库：https://github.com/0213cc/agent
2. 点击 "Actions" 标签
3. 用户应该能看到 "CI/CD" workflow
4. 点击最新的运行查看详情

### 3. 查看构建的镜像

推送成功后，镜像将在：
- https://github.com/0213cc/agent/pkgs/container/agent-backend
- https://github.com/0213cc/agent/pkgs/container/agent-frontend

## 🐛 如果看不到 Workflow

### 检查清单：

1. **确认文件位置正确**
   ```bash
   ls -la .github/workflows/main.yml
   ```
   应该显示文件存在

2. **确认已推送到 GitHub**
   ```bash
   git status
   git log --oneline -1
   ```

3. **检查分支名称**
   - 项目的主分支是 `main` 还是 `master`？
   - 如果是 `master`，workflow 会自动适配

4. **手动触发**
   - 进入 Actions 标签
   - 如果看到 "Get started with GitHub Actions"
   - 点击 "set up a workflow yourself"
   - 然后返回查看是否显示

## 📊 状态徽章

在 README.md 中添加：

```markdown
![CI/CD](https://github.com/0213cc/agent/workflows/CI/CD/badge.svg)
```

## 🔐 Secrets 配置（可选）

如果需要使用 OpenAI API：

1. 进入 Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加：
   - Name: `OPENAI_API_KEY`
   - Value: 项目的 API Key

## 💡 下一步

- [ ] 推送代码到 GitHub
- [ ] 查看 Actions 标签
- [ ] 等待构建完成
- [ ] 查看构建的 Docker 镜像

## 🆘 需要帮助？

如果遇到问题：
1. 检查 Actions 标签的错误日志
2. 确认 .github/workflows/main.yml 文件存在
3. 确认已推送到 GitHub

---

**仓库**: https://github.com/0213cc/agent  
**镜像**: ghcr.io/0213cc/agent-backend:latest, ghcr.io/0213cc/agent-frontend:latest

