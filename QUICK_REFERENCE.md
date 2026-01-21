# 快速参考指南

## 🚀 5 分钟快速开始

### 1. 启动系统

```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh && ./start.sh
```

### 2. 访问应用

- 前端: http://localhost:3000
- API: http://localhost:8000/docs
- Neo4j: http://localhost:7474

### 3. 生成第一个图谱

1. 在输入框输入："熵"
2. 点击"生成知识图谱"
3. 等待 30-60 秒
4. 查看结果并点击节点扩展

## 📋 常用命令

### Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]

# 查看状态
docker-compose ps

# 重新构建
docker-compose build --no-cache
```

### 健康检查

```bash
# 检查后端
curl http://localhost:8000/health

# 检查所有容器
docker-compose ps
```

### 数据库操作

```bash
# 连接Neo4j
docker-compose exec neo4j cypher-shell -u neo4j -p password123

# 连接Redis
docker-compose exec redis redis-cli

# 查看缓存
docker-compose exec redis redis-cli KEYS "graph:*"
```

## 🔧 配置说明

### 环境变量 (.env)

```bash
# 必填
OPENAI_API_KEY=sk-xxx

# 可选
OPENAI_MODEL=gpt-4
NEO4J_PASSWORD=password123
CACHE_TTL=3600
```

### 端口配置

| 服务       | 端口 | 说明     |
| ---------- | ---- | -------- |
| Frontend   | 3000 | Web 界面 |
| Backend    | 8000 | API 服务 |
| Neo4j HTTP | 7474 | 浏览器   |
| Neo4j Bolt | 7687 | 连接     |
| Redis      | 6379 | 缓存     |

## 🐛 故障排查

### 问题 1: 容器启动失败

```bash
# 查看日志
docker-compose logs backend

# 检查端口占用
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# 重启Docker
# Windows: 右键Docker图标 -> Restart
# Linux: sudo systemctl restart docker
```

### 问题 2: Neo4j 连接失败

```bash
# 等待Neo4j完全启动（约30秒）
docker-compose logs neo4j | grep "Started"

# 测试连接
docker-compose exec neo4j cypher-shell -u neo4j -p password123 "RETURN 1"
```

### 问题 3: LLM 调用失败

```bash
# 检查API Key
echo $OPENAI_API_KEY  # Linux/Mac
echo %OPENAI_API_KEY% # Windows

# 测试API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 问题 4: 前端无法访问

```bash
# 检查后端状态
curl http://localhost:8000/health

# 检查网络
docker network inspect knowledge-graph-agent_kg-network

# 重启前端
docker-compose restart frontend
```

## 📊 API 快速参考

### 生成图谱

```bash
curl -X POST http://localhost:8000/api/graph/generate \
  -H "Content-Type: application/json" \
  -d '{"concept": "熵", "enable_validation": true}'
```

### 查询图谱

```bash
curl http://localhost:8000/api/graph/{graph_id}
```

### 扩展节点

```bash
curl -X POST http://localhost:8000/api/graph/expand \
  -H "Content-Type: application/json" \
  -d '{"graph_id": "xxx", "node_id": "香农熵", "enable_validation": true}'
```

### 列出所有图谱

```bash
curl http://localhost:8000/api/graphs
```

## 🗄️ Neo4j 查询示例

```cypher
// 查看所有概念
MATCH (n:Concept) RETURN n LIMIT 25

// 查看关系
MATCH (a:Concept)-[r:RELATES_TO]->(b:Concept)
RETURN a.label, r.relation_type, b.label
LIMIT 10

// 查找特定概念
MATCH (n:Concept {id: "熵"})
RETURN n

// 查找某个概念的所有关联
MATCH (a:Concept {id: "熵"})-[r]->(b:Concept)
RETURN a, r, b

// 删除所有数据（危险！）
MATCH (n) DETACH DELETE n
```

## 📁 重要文件位置

```
配置文件:
  - .env                    环境变量
  - docker-compose.yml      服务编排

后端代码:
  - backend/api/main.py              API入口
  - backend/agent_service/prompts.py Prompt模板
  - backend/agent_service/agent.py   智能体逻辑

前端代码:
  - frontend/src/App.jsx                      主应用
  - frontend/src/components/GraphVisualization.jsx 图谱可视化

文档:
  - README.md                   项目说明
  - docs/architecture.md        架构设计
  - docs/prompt_engineering.md  Prompt工程
  - docs/deployment.md          部署指南
  - docs/DEMO.md               演示说明
```

## 🎯 测试命令

```bash
# 系统测试
python test_system.py

# API测试
./test_api.sh      # Linux/Mac
test_api.bat       # Windows

# 单元测试（如果有）
cd backend && pytest
```

## 🔐 安全提示

1. **不要提交 .env 文件到 Git**
2. **修改默认密码**（Neo4j）
3. **生产环境启用 HTTPS**
4. **定期更新依赖**
5. **限制 API 访问**

## 📦 备份与恢复

### 备份

```bash
# 备份Neo4j
docker-compose exec neo4j neo4j-admin dump \
  --database=neo4j --to=/backups/backup.dump

# 备份Redis
docker-compose exec redis redis-cli BGSAVE
docker cp kg-redis:/data/dump.rdb ./backup-redis.rdb
```

### 恢复

```bash
# 恢复Neo4j
docker-compose exec neo4j neo4j-admin load \
  --from=/backups/backup.dump --database=neo4j --force

# 恢复Redis
docker cp ./backup-redis.rdb kg-redis:/data/dump.rdb
docker-compose restart redis
```

## 🚢 部署到生产

### Docker Compose

```bash
# 使用生产配置
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
# 创建命名空间
kubectl create namespace knowledge-graph

# 创建Secret
kubectl create secret generic kg-secrets \
  --from-literal=openai-api-key=sk-xxx \
  -n knowledge-graph

# 部署
kubectl apply -f k8s/ -n knowledge-graph

# 查看状态
kubectl get pods -n knowledge-graph
```

## 📞 获取帮助

1. **查看文档**: `docs/` 目录
2. **查看日志**: `docker-compose logs -f`
3. **API 文档**: http://localhost:8000/docs
4. **GitHub Issues**: [项目仓库]

## 💡 最佳实践

1. **首次使用**: 先用简单概念测试（如"熵"）
2. **性能优化**: 启用缓存，避免重复生成
3. **错误处理**: 查看日志定位问题
4. **定期备份**: 备份重要的图谱数据
5. **监控资源**: 注意 Docker 资源使用

## 🎓 学习资源

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **Neo4j**: https://neo4j.com/docs/
- **Docker**: https://docs.docker.com/
- **ECharts**: https://echarts.apache.org/

---

**提示**: 将此文件保存为书签，方便快速查阅！
