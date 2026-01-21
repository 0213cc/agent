# CI/CD 配置说明

## 📋 概述

本项目使用 GitHub Actions 实现自动化 CI/CD 流程，包括代码质量检查、Docker 镜像构建、安全扫描和自动部署。

## 🔧 Workflow 文件

### 1. 主 CI/CD 流程 (`.github/workflows/ci-cd.yml`)

完整的 CI/CD 流程，包含以下阶段：

#### 阶段 1: 代码质量检查
- **Python 代码检查**：使用 flake8、black、pylint
- **前端代码检查**：ESLint 和构建测试
- **触发条件**：Push 到 main/develop 分支或 Pull Request

#### 阶段 2: 自动化测试
- **后端测试**：
  - 启动 Redis 和 Neo4j 服务
  - 运行 pytest 单元测试
  - 生成代码覆盖率报告
  - 上传到 Codecov

- **前端测试**：
  - 运行 npm test
  - 构建生产版本

#### 阶段 3: Docker 镜像构建
- 构建 backend 和 frontend 镜像
- 推送到 GitHub Container Registry (ghcr.io)
- 使用 Docker Buildx 多平台构建
- 启用构建缓存加速

#### 阶段 4: 安全扫描
- 使用 Trivy 扫描 Docker 镜像漏洞
- 上传结果到 GitHub Security
- 检测高危漏洞

#### 阶段 5: 自动部署
- **开发环境**：develop 分支自动部署
- **生产环境**：main 分支自动部署
- 需要配置部署脚本

### 2. Docker 构建流程 (`.github/workflows/docker-build.yml`)

简化版的 Docker 镜像构建流程：
- 仅构建和推送 Docker 镜像
- 支持多种标签策略
- 适合快速迭代

### 3. 代码质量检查 (`.github/workflows/code-quality.yml`)

独立的代码质量检查流程：
- 后端 Python 代码 lint
- 前端构建测试
- 可以单独运行

## 🚀 使用方法

### 1. 首次设置

#### 启用 GitHub Actions
1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 启用 GitHub Actions

#### 配置 Secrets
在仓库设置中添加以下 Secrets：

```
Settings → Secrets and variables → Actions → New repository secret
```

必需的 Secrets：
- `OPENAI_API_KEY`: OpenAI API 密钥（用于测试）

可选的 Secrets：
- `DEPLOY_SSH_KEY`: 部署服务器的 SSH 私钥
- `DEPLOY_HOST`: 部署服务器地址
- `DEPLOY_USER`: 部署服务器用户名
- `SLACK_WEBHOOK`: Slack 通知 Webhook URL

#### 启用 GitHub Container Registry
1. 进入 Settings → Packages
2. 确保 "Improved container support" 已启用
3. 设置包的可见性（Public 或 Private）

### 2. 触发 CI/CD

#### 自动触发
- **Push 到 main 分支**：运行完整 CI/CD + 部署到生产
- **Push 到 develop 分支**：运行完整 CI/CD + 部署到开发环境
- **创建 Pull Request**：运行代码检查和测试
- **推送 Tag (v*)**：构建带版本号的镜像

#### 手动触发
1. 进入 Actions 标签
2. 选择要运行的 Workflow
3. 点击 "Run workflow"
4. 选择分支并运行

### 3. 查看运行结果

#### 查看 Workflow 状态
```
Repository → Actions → 选择 Workflow Run
```

#### 查看构建的镜像
```
Repository → Packages
```

镜像地址格式：
```
ghcr.io/<username>/<repo>-backend:latest
ghcr.io/<username>/<repo>-frontend:latest
```

## 📦 Docker 镜像标签策略

### 自动生成的标签

1. **分支名标签**
   - `main` → `latest`
   - `develop` → `develop`

2. **Git SHA 标签**
   - `sha-abc1234` → 特定提交的镜像

3. **版本标签**（当推送 tag 时）
   - `v1.0.0` → `1.0.0`, `1.0`, `latest`

4. **PR 标签**
   - `pr-123` → Pull Request 的镜像

### 使用示例

```bash
# 拉取最新版本
docker pull ghcr.io/<username>/<repo>-backend:latest

# 拉取特定版本
docker pull ghcr.io/<username>/<repo>-backend:1.0.0

# 拉取特定提交
docker pull ghcr.io/<username>/<repo>-backend:sha-abc1234
```

## 🔐 安全最佳实践

### 1. Secrets 管理
- ✅ 使用 GitHub Secrets 存储敏感信息
- ✅ 不要在代码中硬编码密钥
- ✅ 定期轮换密钥

### 2. 镜像安全
- ✅ 使用 Trivy 扫描漏洞
- ✅ 使用最小化基础镜像
- ✅ 定期更新依赖

### 3. 访问控制
- ✅ 使用 GITHUB_TOKEN 进行认证
- ✅ 限制 Workflow 权限
- ✅ 使用环境保护规则

## 🛠️ 自定义部署

### 方式 1: SSH 部署

在 `deploy-prod` job 中添加：

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    username: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_SSH_KEY }}
    script: |
      cd /app/knowledge-graph-agent
      docker-compose pull
      docker-compose up -d
```

### 方式 2: Kubernetes 部署

```yaml
- name: Deploy to Kubernetes
  uses: azure/k8s-deploy@v4
  with:
    manifests: |
      k8s/deployment.yaml
      k8s/service.yaml
    images: |
      ghcr.io/${{ github.repository }}-backend:${{ github.sha }}
      ghcr.io/${{ github.repository }}-frontend:${{ github.sha }}
```

### 方式 3: Docker Swarm 部署

```yaml
- name: Deploy to Docker Swarm
  run: |
    docker stack deploy -c docker-compose.yml kg-stack
```

## 📊 监控和通知

### 1. Slack 通知

在 workflow 末尾添加：

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment completed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### 2. Email 通知

GitHub Actions 默认会发送邮件通知失败的 workflow。

### 3. 状态徽章

在 README.md 中添加：

```markdown
![CI/CD](https://github.com/<username>/<repo>/workflows/CI/CD%20Pipeline/badge.svg)
![Docker Build](https://github.com/<username>/<repo>/workflows/Docker%20Build%20and%20Push/badge.svg)
```

## 🐛 故障排查

### 常见问题

#### 1. Docker 构建失败
```
Error: buildx failed with: ERROR: failed to solve...
```

**解决方案**：
- 检查 Dockerfile 语法
- 确保所有依赖文件存在
- 查看构建日志详细信息

#### 2. 推送镜像失败
```
Error: denied: permission_denied
```

**解决方案**：
- 确保 GITHUB_TOKEN 有 packages:write 权限
- 检查仓库的 Package 设置
- 确认镜像名称格式正确

#### 3. 测试失败
```
Error: Connection refused (Neo4j/Redis)
```

**解决方案**：
- 检查 service 容器配置
- 确保健康检查正确
- 增加等待时间

#### 4. 部署失败
```
Error: SSH connection failed
```

**解决方案**：
- 检查 SSH 密钥格式
- 确认服务器地址和端口
- 测试 SSH 连接

## 📈 性能优化

### 1. 构建缓存
- ✅ 使用 GitHub Actions 缓存
- ✅ 启用 Docker layer 缓存
- ✅ 缓存 npm/pip 依赖

### 2. 并行执行
- ✅ 使用 matrix 策略并行构建
- ✅ 独立的 job 并行运行
- ✅ 合理设置依赖关系

### 3. 条件执行
- ✅ 使用 `if` 条件跳过不必要的步骤
- ✅ 只在特定分支运行部署
- ✅ PR 不推送镜像

## 📚 参考资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Trivy 安全扫描](https://github.com/aquasecurity/trivy-action)

## 🔄 更新日志

- **2026-01-22**: 初始版本
  - 添加完整 CI/CD 流程
  - 支持 Docker 镜像构建
  - 集成安全扫描
  - 配置自动部署

---

**维护者**: 项目团队  
**最后更新**: 2026-01-22

