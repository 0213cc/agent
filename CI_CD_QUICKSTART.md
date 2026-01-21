# CI/CD 快速开始指南

## 🚀 5 分钟快速设置

### 步骤 1: 推送代码到 GitHub

```bash
# 初始化 git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit with CI/CD"

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 推送到 GitHub
git push -u origin main
```

### 步骤 2: 配置 GitHub Secrets

1. 进入项目的 GitHub 仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 添加以下 Secret：

| Name | Value | 说明 |
|------|-------|------|
| `OPENAI_API_KEY` | 项目的 OpenAI API Key | 必需，用于 LLM 功能 |

### 步骤 3: 启用 GitHub Actions

1. 进入仓库的 `Actions` 标签
2. 如果看到提示，点击 `I understand my workflows, go ahead and enable them`
3. GitHub Actions 现在已启用！

### 步骤 4: 触发第一次构建

```bash
# 方式 1: 推送代码触发
git commit --allow-empty -m "Trigger CI/CD"
git push

# 方式 2: 在 GitHub 网页手动触发
# Actions → 选择 workflow → Run workflow
```

### 步骤 5: 查看构建结果

1. 进入 `Actions` 标签
2. 点击最新的 workflow run
3. 查看每个 job 的执行情况

## 📦 使用构建的 Docker 镜像

### 拉取镜像

```bash
# 登录 GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO-backend:latest
docker pull ghcr.io/YOUR_USERNAME/YOUR_REPO-frontend:latest
```

### 使用镜像运行

修改 `docker-compose.yml`：

```yaml
services:
  backend:
    image: ghcr.io/YOUR_USERNAME/YOUR_REPO-backend:latest
    # 移除 build 部分
    
  frontend:
    image: ghcr.io/YOUR_USERNAME/YOUR_REPO-frontend:latest
    # 移除 build 部分
```

然后运行：

```bash
docker-compose up -d
```

## 🔧 常用命令

### 查看 Workflow 状态

```bash
# 使用 GitHub CLI
gh workflow list
gh run list
gh run view <run-id>
```

### 手动触发 Workflow

```bash
gh workflow run "CI/CD Pipeline"
```

### 查看日志

```bash
gh run view --log
```

## 📊 监控构建

### 添加状态徽章到 README

在 `README.md` 顶部添加：

```markdown
![CI/CD](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/CD%20Pipeline/badge.svg)
```

### 设置通知

1. GitHub 默认会发送邮件通知失败的构建
2. 可以在 `Settings` → `Notifications` 中配置

## 🐛 故障排查

### 构建失败？

1. 查看 Actions 日志
2. 检查错误信息
3. 常见问题：
   - 缺少 Secrets
   - Dockerfile 错误
   - 依赖安装失败

### 镜像推送失败？

1. 确保 `GITHUB_TOKEN` 有权限
2. 检查仓库的 Package 设置
3. 确认镜像名称格式正确

### 部署失败？

1. 检查部署脚本
2. 确认服务器连接
3. 查看服务器日志

## 📚 下一步

- [ ] 阅读完整的 [CI/CD 指南](CI_CD_GUIDE.md)
- [ ] 配置自动部署
- [ ] 设置 Slack 通知
- [ ] 添加更多测试
- [ ] 配置代码覆盖率

## 🆘 需要帮助？

- 查看 [GitHub Actions 文档](https://docs.github.com/en/actions)
- 查看项目的 [CI_CD_GUIDE.md](CI_CD_GUIDE.md)
- 提交 Issue

---

**提示**: 将文档中所有 `YOUR_USERNAME` 和 `YOUR_REPO` 替换为项目的实际 GitHub 用户名和仓库名。

