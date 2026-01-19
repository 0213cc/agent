import React, { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import './GraphVisualization.css';

const DOMAIN_COLORS = {
  'Mathematics': '#e74c3c',
  'Physics': '#3498db',
  'Computer Science': '#2ecc71',
  'Biology': '#f39c12',
  'Sociology': '#9b59b6',
  '数学': '#e74c3c',
  '物理学': '#3498db',
  '计算机科学': '#2ecc71',
  '生物学': '#f39c12',
  '社会学': '#9b59b6',
  'Unknown': '#95a5a6'
};

function GraphVisualization({ data, onNodeClick, loading }) {
  const chartRef = useRef(null);

  const getOption = () => {
    if (!data || !data.nodes || !data.edges) {
      return {};
    }

    // 转换节点数据
    const nodes = data.nodes.map(node => ({
      id: node.id,
      name: node.label || node.id,
      symbolSize: node.type === 'center' ? 80 : 50,
      itemStyle: {
        color: DOMAIN_COLORS[node.domain] || DOMAIN_COLORS['Unknown']
      },
      label: {
        show: true,
        fontSize: node.type === 'center' ? 14 : 11,
        fontWeight: node.type === 'center' ? 'bold' : 'normal'
      },
      category: node.domain,
      value: node.definition || node.domain,
      tooltip: {
        formatter: (params) => {
          return `
            <div style="padding: 10px;">
              <strong style="font-size: 16px;">${params.data.name}</strong><br/>
              <span style="color: #666;">学科：${node.domain}</span><br/>
              ${node.definition ? `<span style="color: #888; font-size: 12px;">${node.definition}</span>` : ''}
            </div>
          `;
        }
      }
    }));

    // 转换边数据
    const links = data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      lineStyle: {
        width: Math.max(1, edge.strength / 2),
        opacity: 0.6,
        curveness: 0.2
      },
      label: {
        show: false,
        formatter: edge.relation_type
      },
      tooltip: {
        formatter: () => {
          return `
            <div style="padding: 10px; max-width: 300px;">
              <strong>${edge.relation_type}</strong><br/>
              <span style="color: #666;">强度：${edge.strength}/10</span><br/>
              <span style="color: #888; font-size: 12px;">${edge.explanation}</span>
            </div>
          `;
        }
      }
    }));

    // 获取所有学科类别
    const categories = [...new Set(data.nodes.map(n => n.domain))].map(domain => ({
      name: domain,
      itemStyle: {
        color: DOMAIN_COLORS[domain] || DOMAIN_COLORS['Unknown']
      }
    }));

    return {
      title: {
        text: '跨学科知识图谱',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      legend: [{
        data: categories.map(c => c.name),
        orient: 'vertical',
        left: 10,
        top: 60,
        textStyle: {
          fontSize: 12
        }
      }],
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          categories: categories,
          roam: true,
          label: {
            position: 'bottom',
            show: true
          },
          force: {
            repulsion: 300,
            gravity: 0.1,
            edgeLength: [100, 200],
            layoutAnimation: true
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4
            },
            label: {
              fontSize: 16
            }
          },
          lineStyle: {
            color: 'source',
            curveness: 0.2
          }
        }
      ]
    };
  };

  const handleChartClick = (params) => {
    if (params.dataType === 'node' && !loading) {
      const nodeId = params.data.id;
      if (onNodeClick) {
        onNodeClick(nodeId);
      }
    }
  };

  const onEvents = {
    click: handleChartClick
  };

  return (
    <div className="graph-visualization">
      {data && data.nodes && data.nodes.length > 0 ? (
        <ReactECharts
          ref={chartRef}
          option={getOption()}
          style={{ height: '600px', width: '100%' }}
          onEvents={onEvents}
          notMerge={true}
          lazyUpdate={true}
        />
      ) : (
        <div className="no-data">
          <p>暂无数据</p>
        </div>
      )}
      
      {loading && (
        <div className="graph-loading-overlay">
          <div className="graph-spinner"></div>
          <p>正在扩展节点...</p>
        </div>
      )}
    </div>
  );
}

export default GraphVisualization;

