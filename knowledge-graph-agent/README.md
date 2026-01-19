# 跨学科知识图谱智能体

## 项目简介

这是一个基于云原生架构的跨学科知识图谱智能体系统，能够挖掘不同学科间的概念关联，并构建可视化的知识图谱。

### 核心功能

- **关联挖掘**: 在数学、物理、计算机科学、生物学、社会学等多个学科中寻找概念关联
- **图谱构建**: 自动提取实体及其关系，生成标准的节点/边数据结构
- **动态可视化**: 在 Web 端渲染可交互的跨学科知识网络
- **智能校验**: 通过多重验证机制防止 LLM 幻觉

## 技术架构

### 云原生组件

- **容器化**: Docker + Docker Compose
- **后端框架**: FastAPI (异步高性能)
- **智能体引擎**: LangChain + OpenAI API
- **图数据库**: Neo4j
- **缓存层**: Redis
- **前端**: React + Vite + ECharts
- **编排**: Kubernetes (可选)

### 系统架构图

```
┌─────────────────────────────────────────────────┐
│            前端 (React + ECharts)                │
│              可视化知识图谱                       │
└─────────────────┬───────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────┐
│           API Gateway (FastAPI)                 │
│         统一入口 + 请求验证 + 日志                │
└─────┬───────────────────────┬───────────────────┘
      │                       │
┌─────▼──────────┐    ┌──────▼────────────────────┐
│  Agent Service │    │  Knowledge Graph Service  │
│  - Prompt工程  │    │  - 实体关系提取            │
│  - LLM调用     │◄───┤  - Neo4j存储              │
│  - 校验层      │    │  - 图谱查询API             │
└────────┬───────┘    └───────────────────────────┘
         │
    ┌────▼────┐
    │  Redis  │
    │  缓存层  │
    └─────────┘
```

## 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- OpenAI API Key (或其他兼容的 LLM API)

### 一键启动

1. 克隆仓库

```bash
git clone <repository-url>
cd knowledge-graph-agent
```

2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 OPENAI_API_KEY
```

3. 启动所有服务

```bash
docker-compose up -d
```

4. 访问应用

- 前端界面: http://localhost:3000
- API 文档: http://localhost:8000/docs
- Neo4j 浏览器: http://localhost:7474

### 使用示例

1. 在前端输入框中输入一个核心概念，例如："熵"
2. 点击"生成知识图谱"按钮
3. 系统将自动：
   - 在多个学科中寻找相关概念
   - 提取概念间的关系
   - 验证关系的合理性
   - 生成可视化图谱
4. 点击图谱中的节点可以进一步扩展该概念

## 项目结构

```
knowledge-graph-agent/
├── README.md                    # 项目说明文档
├── docker-compose.yml           # Docker编排配置
├── .env.example                 # 环境变量模板
├── backend/                     # 后端服务
│   ├── Dockerfile              # 后端容器配置
│   ├── requirements.txt        # Python依赖
│   ├── agent_service/          # 智能体服务
│   │   ├── __init__.py
│   │   ├── prompts.py         # Prompt模板
│   │   ├── llm_client.py      # LLM客户端
│   │   └── validator.py       # 校验层
│   ├── graph_service/          # 图谱服务
│   │   ├── __init__.py
│   │   ├── neo4j_client.py    # Neo4j客户端
│   │   └── entity_extractor.py # 实体提取
│   └── api/                    # API层
│       ├── __init__.py
│       └── main.py            # FastAPI入口
├── frontend/                   # 前端服务
│   ├── Dockerfile             # 前端容器配置
│   ├── package.json           # Node依赖
│   ├── vite.config.js         # Vite配置
│   ├── index.html
│   └── src/
│       ├── App.jsx            # 主应用
│       ├── main.jsx           # 入口文件
│       └── components/
│           └── GraphVisualization.jsx  # 图谱可视化组件
├── docs/                       # 技术文档
│   ├── architecture.md        # 架构设计文档
│   ├── prompt_engineering.md  # Prompt工程文档
│   └── deployment.md          # 部署指南
└── k8s/                        # Kubernetes配置
    ├── deployment.yaml        # 部署配置
    └── service.yaml           # 服务配置
```

## 开发指南

### 本地开发

#### 后端开发

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

#### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 运行测试

```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
npm test
```

## API 文档

启动服务后访问 http://localhost:8000/docs 查看完整的 API 文档。

### 主要接口

- `POST /api/graph/generate` - 生成知识图谱
- `GET /api/graph/{concept_id}` - 查询已有图谱
- `POST /api/graph/expand` - 扩展图谱节点
- `GET /api/health` - 健康检查

## 智能体设计

### Prompt 工程

系统使用多阶段 Prompt 策略：

1. **概念识别阶段**: 识别输入概念的主要学科归属
2. **跨学科挖掘阶段**: 在 5 个不同学科中寻找相关概念
3. **关系提取阶段**: 提取概念间的关系类型和强度
4. **校验阶段**: 多重验证确保关系合理性

### 校验层 (Check Layer)

为防止 LLM 幻觉，系统实现了三重校验机制：

1. **一致性检查**: 多次采样验证结果一致性
2. **反向验证**: 从目标概念反向验证关系
3. **置信度评分**: 对每个关系进行置信度评估

详见 [Prompt 工程文档](docs/prompt_engineering.md)

## 部署指南

### Docker 部署

```bash
docker-compose up -d
```

### Kubernetes 部署

```bash
kubectl apply -f k8s/
```

详见 [部署指南](docs/deployment.md)

## 性能优化

- **Redis 缓存**: 缓存已生成的图谱，避免重复 LLM 调用
- **异步处理**: FastAPI 异步接口提升并发性能
- **连接池**: Neo4j 和 Redis 使用连接池管理
- **前端优化**: 图谱按需加载，大图谱分批渲染

## 故障排查

### 常见问题

1. **容器启动失败**

   - 检查 Docker 是否正常运行
   - 确认端口未被占用 (3000, 8000, 7474, 7687, 6379)

2. **LLM 调用失败**

   - 检查 .env 中的 OPENAI_API_KEY 是否正确
   - 确认网络可以访问 OpenAI API

3. **Neo4j 连接失败**
   - 等待 Neo4j 完全启动 (约 30 秒)
   - 检查 Neo4j 日志: `docker-compose logs neo4j`

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

- 项目负责人: [Your Name]
- Email: [Your Email]
