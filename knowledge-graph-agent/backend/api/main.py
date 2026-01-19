"""
FastAPI主应用
提供REST API接口
"""
import os
import logging
import hashlib
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as redis

from agent_service.agent import AgentService
from graph_service.neo4j_client import Neo4jClient

# 配置日志
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 全局变量
agent_service: Optional[AgentService] = None
neo4j_client: Optional[Neo4jClient] = None
redis_client: Optional[redis.Redis] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global agent_service, neo4j_client, redis_client
    
    # 启动时初始化
    logger.info("Initializing services...")
    
    agent_service = AgentService()
    neo4j_client = Neo4jClient()
    await neo4j_client.connect()
    
    # 初始化Redis
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))
    redis_client = await redis.from_url(
        f"redis://{redis_host}:{redis_port}",
        encoding="utf-8",
        decode_responses=True
    )
    
    logger.info("All services initialized successfully")
    
    yield
    
    # 关闭时清理
    logger.info("Shutting down services...")
    if neo4j_client:
        await neo4j_client.close()
    if redis_client:
        await redis_client.close()
    logger.info("All services shut down")


# 创建FastAPI应用
app = FastAPI(
    title="跨学科知识图谱智能体 API",
    description="基于LLM的跨学科知识图谱生成系统",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ 数据模型 ============

class GenerateGraphRequest(BaseModel):
    """生成图谱请求"""
    concept: str = Field(..., description="核心概念", min_length=1, max_length=100)
    enable_validation: bool = Field(True, description="是否启用校验层")


class ExpandNodeRequest(BaseModel):
    """扩展节点请求"""
    graph_id: str = Field(..., description="图谱ID")
    node_id: str = Field(..., description="节点ID")
    enable_validation: bool = Field(True, description="是否启用校验层")


class GraphResponse(BaseModel):
    """图谱响应"""
    success: bool
    message: Optional[str] = None
    data: Optional[dict] = None


# ============ API端点 ============

@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "跨学科知识图谱智能体 API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # 检查Neo4j
    try:
        if neo4j_client and neo4j_client.driver:
            await neo4j_client.driver.verify_connectivity()
            health_status["services"]["neo4j"] = "connected"
        else:
            health_status["services"]["neo4j"] = "not initialized"
    except Exception as e:
        health_status["services"]["neo4j"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # 检查Redis
    try:
        if redis_client:
            await redis_client.ping()
            health_status["services"]["redis"] = "connected"
        else:
            health_status["services"]["redis"] = "not initialized"
    except Exception as e:
        health_status["services"]["redis"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status


@app.post("/api/graph/generate", response_model=GraphResponse)
async def generate_graph(request: GenerateGraphRequest):
    """
    生成知识图谱
    
    - **concept**: 核心概念（如"熵"、"神经网络"）
    - **enable_validation**: 是否启用校验层（推荐开启）
    """
    try:
        logger.info(f"Received request to generate graph for: {request.concept}")
        
        # 生成图谱ID
        graph_id = hashlib.md5(request.concept.encode()).hexdigest()
        
        # 检查缓存
        cache_key = f"graph:{graph_id}"
        cached_data = await redis_client.get(cache_key)
        
        if cached_data:
            logger.info(f"Returning cached graph for: {request.concept}")
            import json
            return GraphResponse(
                success=True,
                message="从缓存返回",
                data=json.loads(cached_data)
            )
        
        # 生成图谱
        result = await agent_service.generate_knowledge_graph(
            concept=request.concept,
            enable_validation=request.enable_validation
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        # 保存到Neo4j
        graph_data = result.get("graph", {})
        await neo4j_client.create_graph(
            graph_id=graph_id,
            nodes=graph_data.get("nodes", []),
            edges=graph_data.get("edges", [])
        )
        
        # 缓存结果
        import json
        cache_ttl = int(os.getenv("CACHE_TTL", "3600"))
        await redis_client.setex(
            cache_key,
            cache_ttl,
            json.dumps(result)
        )
        
        return GraphResponse(
            success=True,
            message="图谱生成成功",
            data={
                "graph_id": graph_id,
                **result
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating graph: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/graph/{graph_id}", response_model=GraphResponse)
async def get_graph(graph_id: str):
    """
    获取已生成的知识图谱
    
    - **graph_id**: 图谱ID
    """
    try:
        logger.info(f"Fetching graph: {graph_id}")
        
        # 从Neo4j获取
        graph_data = await neo4j_client.get_graph(graph_id)
        
        if not graph_data:
            raise HTTPException(status_code=404, detail="Graph not found")
        
        return GraphResponse(
            success=True,
            message="图谱获取成功",
            data={
                "graph_id": graph_id,
                "graph": graph_data
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching graph: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/graph/expand", response_model=GraphResponse)
async def expand_node(request: ExpandNodeRequest):
    """
    扩展图谱节点
    
    - **graph_id**: 图谱ID
    - **node_id**: 要扩展的节点ID
    - **enable_validation**: 是否启用校验层
    """
    try:
        logger.info(f"Expanding node {request.node_id} in graph {request.graph_id}")
        
        # 获取节点信息
        graph_data = await neo4j_client.get_graph(request.graph_id)
        if not graph_data:
            raise HTTPException(status_code=404, detail="Graph not found")
        
        # 找到目标节点
        target_node = None
        for node in graph_data.get("nodes", []):
            if node["id"] == request.node_id:
                target_node = node
                break
        
        if not target_node:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # 扩展概念
        expansion_result = await agent_service.expand_concept(
            concept=target_node["id"],
            domain=target_node.get("domain", "Unknown"),
            enable_validation=request.enable_validation
        )
        
        if not expansion_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=expansion_result.get("error", "Expansion failed")
            )
        
        # 构建新节点和边
        new_nodes = []
        new_edges = []
        
        for idx, relation in enumerate(expansion_result.get("expansions", [])):
            target_id = relation.get("target_concept")
            
            # 检查节点是否已存在
            node_exists = any(n["id"] == target_id for n in graph_data.get("nodes", []))
            
            if not node_exists:
                new_nodes.append({
                    "id": target_id,
                    "label": target_id,
                    "domain": relation.get("target_domain", ""),
                    "type": "related"
                })
            
            new_edges.append({
                "id": f"edge_exp_{request.node_id}_{idx}",
                "source": request.node_id,
                "target": target_id,
                "relation_type": relation.get("relation_type", ""),
                "strength": relation.get("relation_strength", 5),
                "explanation": relation.get("explanation", ""),
                "confidence": relation.get("confidence", 1.0)
            })
        
        # 保存到Neo4j
        await neo4j_client.expand_node(
            graph_id=request.graph_id,
            node_id=request.node_id,
            new_nodes=new_nodes,
            new_edges=new_edges
        )
        
        # 清除缓存
        cache_key = f"graph:{request.graph_id}"
        await redis_client.delete(cache_key)
        
        return GraphResponse(
            success=True,
            message="节点扩展成功",
            data={
                "new_nodes": new_nodes,
                "new_edges": new_edges,
                "count": len(new_nodes)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error expanding node: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/graph/{graph_id}")
async def delete_graph(graph_id: str):
    """
    删除知识图谱
    
    - **graph_id**: 图谱ID
    """
    try:
        logger.info(f"Deleting graph: {graph_id}")
        
        await neo4j_client.delete_graph(graph_id)
        
        # 清除缓存
        cache_key = f"graph:{graph_id}"
        await redis_client.delete(cache_key)
        
        return GraphResponse(
            success=True,
            message="图谱删除成功"
        )
        
    except Exception as e:
        logger.error(f"Error deleting graph: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/graphs")
async def list_graphs():
    """列出所有图谱"""
    try:
        graph_ids = await neo4j_client.list_graphs()
        
        return GraphResponse(
            success=True,
            message=f"找到 {len(graph_ids)} 个图谱",
            data={
                "graphs": graph_ids,
                "count": len(graph_ids)
            }
        )
        
    except Exception as e:
        logger.error(f"Error listing graphs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

