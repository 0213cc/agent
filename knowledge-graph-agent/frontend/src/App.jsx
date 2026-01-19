import React, { useState } from 'react';
import axios from 'axios';
import GraphVisualization from './components/GraphVisualization';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function App() {
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState(null);
  const [graphId, setGraphId] = useState(null);

  const handleGenerate = async () => {
    if (!concept.trim()) {
      setError('请输入一个概念');
      return;
    }

    setLoading(true);
    setError(null);
    setGraphData(null);

    try {
      const response = await axios.post(`${API_BASE}/graph/generate`, {
        concept: concept.trim(),
        enable_validation: true
      });

      if (response.data.success) {
        setGraphData(response.data.data.graph);
        setGraphId(response.data.data.graph_id);
      } else {
        setError('生成失败：' + (response.data.message || '未知错误'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError('生成失败：' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (nodeId) => {
    if (!graphId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/graph/expand`, {
        graph_id: graphId,
        node_id: nodeId,
        enable_validation: true
      });

      if (response.data.success) {
        // 重新获取完整图谱
        const graphResponse = await axios.get(`${API_BASE}/graph/${graphId}`);
        if (graphResponse.data.success) {
          setGraphData(graphResponse.data.data.graph);
        }
      } else {
        setError('扩展失败：' + (response.data.message || '未知错误'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError('扩展失败：' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">🌐 跨学科知识图谱智能体</h1>
        <p className="subtitle">探索概念间的深层联系，发现知识的"远亲"关系</p>
      </div>

      <div className="input-section">
        <div className="input-container">
          <input
            type="text"
            className="concept-input"
            placeholder="输入一个概念，如：熵、神经网络、最小二乘法..."
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? '生成中...' : '生成知识图谱'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      {loading && !graphData && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">正在挖掘跨学科关联...</p>
          <p className="loading-subtext">这可能需要30-60秒</p>
        </div>
      )}

      {graphData && (
        <div className="graph-container">
          <div className="graph-info">
            <div className="info-item">
              <span className="info-label">节点数：</span>
              <span className="info-value">{graphData.nodes?.length || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-label">关系数：</span>
              <span className="info-value">{graphData.edges?.length || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-label">学科数：</span>
              <span className="info-value">
                {new Set(graphData.nodes?.map(n => n.domain)).size || 0}
              </span>
            </div>
          </div>

          <GraphVisualization
            data={graphData}
            onNodeClick={handleExpand}
            loading={loading}
          />

          <div className="instructions">
            <p>💡 <strong>提示：</strong>点击节点可以进一步扩展该概念的关联</p>
          </div>
        </div>
      )}

      {!loading && !graphData && !error && (
        <div className="welcome-section">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>智能挖掘</h3>
              <p>在数学、物理、计算机、生物、社会学等多个学科中自动发现概念关联</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>严格校验</h3>
              <p>通过多重验证机制确保关系的准确性，防止AI幻觉</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>可视化</h3>
              <p>交互式图谱展示，直观呈现跨学科知识网络</p>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>基于云原生架构 | Docker + FastAPI + Neo4j + Redis + React</p>
      </footer>
    </div>
  );
}

export default App;

