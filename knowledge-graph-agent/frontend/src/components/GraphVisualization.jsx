import React, { useEffect, useRef, useCallback, useState } from "react";
import ReactECharts from "echarts-for-react";
import "./GraphVisualization.css";

// 扩展的颜色调色板 - 30种不同的颜色
const COLOR_PALETTE = [
  "#e74c3c", // 红色
  "#3498db", // 蓝色
  "#2ecc71", // 绿色
  "#f39c12", // 橙色
  "#9b59b6", // 紫色
  "#1abc9c", // 青绿色
  "#e67e22", // 深橙色
  "#34495e", // 深蓝灰
  "#16a085", // 深青色
  "#27ae60", // 深绿色
  "#2980b9", // 深蓝色
  "#8e44ad", // 深紫色
  "#c0392b", // 深红色
  "#d35400", // 南瓜橙
  "#f1c40f", // 黄色
  "#e91e63", // 粉红色
  "#9c27b0", // 紫罗兰
  "#673ab7", // 深紫罗兰
  "#3f51b5", // 靛蓝
  "#2196f3", // 亮蓝色
  "#00bcd4", // 青色
  "#009688", // 蓝绿色
  "#4caf50", // 浅绿色
  "#8bc34a", // 黄绿色
  "#cddc39", // 柠檬绿
  "#ff9800", // 琥珀色
  "#ff5722", // 深橙红
  "#795548", // 棕色
  "#607d8b", // 蓝灰色
  "#ec407a", // 玫瑰红
];

const DOMAIN_COLORS = {
  Mathematics: "#e74c3c",
  Physics: "#3498db",
  "Computer Science": "#2ecc71",
  Biology: "#f39c12",
  Sociology: "#9b59b6",
  数学: "#e74c3c",
  物理学: "#3498db",
  计算机科学: "#2ecc71",
  生物学: "#f39c12",
  社会学: "#9b59b6",
  Unknown: "#95a5a6",
};

// 动态分配颜色的函数
const getDomainColor = (domain, allDomains) => {
  // 如果已经在预定义颜色中，直接返回
  if (DOMAIN_COLORS[domain]) {
    return DOMAIN_COLORS[domain];
  }

  // 否则从调色板中按顺序分配
  const domainList = Array.from(allDomains).sort();
  const index = domainList.indexOf(domain);
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

function GraphVisualization({ data, onNodeClick, onNodeRightClick, loading }) {
  const chartRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const clickTimeoutRef = useRef(null);

  const getOption = (is3D) => {
    if (!data || !data.nodes || !data.edges) {
      return {};
    }

    // 获取所有学科
    const allDomains = new Set(data.nodes.map((n) => n.domain));

    // 转换节点数据
    const nodes = data.nodes.map((node, idx) => ({
      id: node.id,
      name: node.label || node.id,
      // 在 3D 模式下稍微放大并通过索引制造深度感
      symbolSize: Math.round(
        (node.type === "center" ? 80 : 50) * (is3D ? 1 + (idx % 5) * 0.08 : 1),
      ),
      itemStyle: {
        color: getDomainColor(node.domain, allDomains),
        // 3D 模式下添加阴影模拟深度
        shadowBlur: is3D ? (18 * ((idx % 5) + 1)) / 5 : 0,
        shadowColor: is3D ? "rgba(0,0,0,0.25)" : "transparent",
      },
      label: {
        show: true,
        fontSize: node.type === "center" ? 14 : 11,
        fontWeight: node.type === "center" ? "bold" : "normal",
      },
      category: node.domain,
      value: node.definition || node.domain,
      tooltip: {
        formatter: (params) => {
          return `
            <div style="padding: 10px;">
              <strong style="font-size: 16px;">${params.data.name}</strong><br/>
              <span style="color: #666;">学科：${node.domain}</span><br/>
              ${node.definition ? `<span style="color: #888; font-size: 12px;">${node.definition}</span>` : ""}
            </div>
          `;
        },
      },
    }));

    // 转换边数据
    const links = data.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      lineStyle: {
        width: Math.max(1, edge.strength / 2) * (is3D ? 1.1 : 1),
        opacity: 0.6,
        curveness: 0.2,
      },
      label: {
        show: false,
        formatter: edge.relation_type,
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
        },
      },
    }));

    // 获取所有学科类别
    const categories = Array.from(allDomains)
      .sort()
      .map((domain) => ({
        name: domain,
        itemStyle: {
          color: getDomainColor(domain, allDomains),
        },
      }));

    return {
      title: {
        text: "跨学科知识图谱",
        left: "center",
        top: 10,
        textStyle: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#333",
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#ddd",
        borderWidth: 1,
        textStyle: {
          color: "#333",
        },
      },
      legend: [
        {
          data: categories.map((c) => c.name),
          orient: "vertical",
          left: 10,
          top: 60,
          textStyle: {
            fontSize: 12,
          },
        },
      ],
      animationDuration: 1500,
      animationEasingUpdate: "quinticInOut",
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          categories: categories,
          roam: true,
          label: {
            position: "bottom",
            show: true,
          },
          force: {
            // 3D 模拟时增大斥力让节点层次更明显
            repulsion: is3D ? 420 : 300,
            gravity: 0.1,
            edgeLength: is3D ? [120, 250] : [100, 200],
            layoutAnimation: true,
            friction: 0.6,
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 4,
            },
            label: {
              fontSize: 16,
            },
          },
          lineStyle: {
            color: "source",
            curveness: 0.2,
          },
        },
      ],
    };
  };

  const [is3D, setIs3D] = useState(false);
  const fgContainerRef = useRef(null);
  const fgInstanceRef = useRef(null);

  const handleChartClick = useCallback(
    (params) => {
      if (params.dataType === "node" && !loading) {
        const nodeId = params.data.id;
        if (onNodeClick) {
          onNodeClick(nodeId);
        }
      }
    },
    [loading, onNodeClick],
  );

  const handleChartRightClick = useCallback(
    (params) => {
      // 阻止浏览器默认右键菜单
      if (params.event?.event) {
        params.event.event.preventDefault();
        params.event.event.stopPropagation();
      }

      // 防抖：300ms 内只处理一次右键点击
      const now = Date.now();
      if (now - lastClickTimeRef.current < 300) {
        console.log("防抖：忽略重复的右键点击");
        return false;
      }
      lastClickTimeRef.current = now;

      // 清除之前的定时器
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      // 延迟执行，避免重复触发
      clickTimeoutRef.current = setTimeout(() => {
        if (params.dataType === "node" && !loading) {
          const nodeId = params.data.id;
          console.log("执行右键点击处理:", nodeId);
          if (onNodeRightClick) {
            onNodeRightClick(nodeId);
          }
        }
      }, 50);

      // 阻止事件冒泡
      return false;
    },
    [loading, onNodeRightClick],
  );

  const onEvents = {
    click: handleChartClick,
    contextmenu: handleChartRightClick,
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // 3D graph: dynamic load and render when is3D = true
  useEffect(() => {
    let mounted = true;

    const init3D = async () => {
      if (!is3D) return;
      if (!data || !data.nodes) return;
      if (!fgContainerRef.current) return;

      try {
        const [{ default: ForceGraph3D }, THREE] = await Promise.all([
          import("3d-force-graph"),
          import("three"),
        ]);

        if (!mounted) return;

        // clear previous content
        fgContainerRef.current.innerHTML = "";

        // helper: create a sprite with text to place inside/near the sphere
        const createTextSprite = (THREE, text) => {
          const canvas = document.createElement("canvas");
          // larger canvas for better resolution when scaling
          const size = 1024;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, size, size);
          ctx.fillStyle = "rgba(0,0,0,0)";
          ctx.fillRect(0, 0, size, size);
          // 黑色填充文字，无描边
          ctx.fillStyle = "#000000";
          // larger base font for better readability on sprites
          ctx.font = "192px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // wrap text if too long
          const lines = [];
          const words = String(text).split(" ");
          let line = "";
          for (let i = 0; i < words.length; i++) {
            const testLine = line + (line ? " " : "") + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > size * 0.86 && line) {
              lines.push(line);
              line = words[i];
            } else {
              line = testLine;
            }
          }
          if (line) lines.push(line);
          const lineHeight = 64;
          const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
          ctx.fillStyle = "rgba(30,30,30,0.95)";
          for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], size / 2, startY + i * lineHeight);
          }
          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            depthTest: false,
          });
          const sprite = new THREE.Sprite(material);
          sprite.renderOrder = 999;
          return sprite;
        };

        const Graph = ForceGraph3D()(fgContainerRef.current)
          .graphData({
            nodes: data.nodes.map((n) => ({
              id: n.id,
              name: n.label || n.id,
              domain: n.domain,
              definition: n.definition,
              type: n.type,
            })),
            links: data.edges.map((e) => ({
              source: e.source,
              target: e.target,
              relation_type: e.relation_type,
              strength: e.strength,
            })),
          })
          .backgroundColor("#fafafa")
          .nodeThreeObject((node) => {
            const size =
              (node.type === "center" ? 8 : 5) *
              (1 + ((node.id?.length || 1) % 3) * 0.12);
            const material = new THREE.MeshStandardMaterial({
              color: getDomainColor(
                node.domain,
                new Set(data.nodes.map((n) => n.domain)),
              ),
              roughness: 0.6,
              metalness: 0.1,
            });
            const sphereGeom = new THREE.SphereGeometry(size, 16, 12);
            const mesh = new THREE.Mesh(sphereGeom, material);
            return mesh;
          })
          .linkWidth((link) => Math.max(0.5, (link.strength || 1) / 2))
          .linkColor(() => "rgba(120,120,120,0.6)")
          .enableNodeDrag(true)
          .showNavInfo(false)
          .onNodeClick((node, evt) => {
            if (!loading && onNodeClick) onNodeClick(node.id);
          })
          .onNodeRightClick((node, evt) => {
            if (!loading && onNodeRightClick) onNodeRightClick(node.id);
          })
          .nodeThreeObject((node) => {
            // semi-transparent sphere
            const baseSize = node.type === "center" ? 8 : 5;
            const size = baseSize * (1 + ((node.id?.length || 1) % 3) * 0.12);
            const color = getDomainColor(
              node.domain,
              new Set(data.nodes.map((n) => n.domain)),
            );
            const material = new THREE.MeshStandardMaterial({
              color,
              roughness: 0.6,
              metalness: 0.1,
              transparent: true,
              opacity: 0.62,
            });
            const sphereGeom = new THREE.SphereGeometry(size, 24, 16);
            const mesh = new THREE.Mesh(sphereGeom, material);

            // add text sprite and place it outside the sphere surface (front edge)
            try {
              const sprite = createTextSprite(THREE, node.name || node.id);
              // place sprite at the center of the sphere
              sprite.position.set(0, 0, 0.01);
              // fixed scale: keep existing scale (unchanged)
              const fixedScale = Math.max(1.5, size * 1.2);
              sprite.scale.set(fixedScale, fixedScale, 1);

              // make sure sprite always renders on top
              if (sprite.material) {
                sprite.material.depthTest = false;
                sprite.material.depthWrite = false;
              }

              mesh.add(sprite);
            } catch (e) {
              // ignore sprite errors
            }

            return mesh;
          })
          .linkWidth(1)
          // use semi-transparent solid lines for links
          .linkMaterial(
            () =>
              new THREE.LineBasicMaterial({
                color: 0x999999,
                transparent: true,
                opacity: 0.45,
              }),
          )
          .enableNodeDrag(true)
          .showNavInfo(false)
          .onNodeClick((node, evt) => {
            if (!loading && onNodeClick) onNodeClick(node.id);
          })
          .onNodeRightClick((node, evt) => {
            if (!loading && onNodeRightClick) onNodeRightClick(node.id);
          });

        // add light
        const scene = Graph.scene();
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(0, 50, 50);
        scene.add(light);
        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(amb);

        fgInstanceRef.current = Graph;
      } catch (err) {
        console.error("Failed to load 3D graph libs", err);
      }
    };

    const destroy3D = () => {
      try {
        if (fgInstanceRef.current) {
          // remove DOM content and attempt to stop simulation
          const container = fgContainerRef.current;
          if (container) {
            container.innerHTML = "";
          }
          try {
            fgInstanceRef.current.pauseAnimation &&
              fgInstanceRef.current.pauseAnimation();
          } catch (e) {}
          fgInstanceRef.current = null;
        }
      } catch (e) {
        console.warn("Error destroying 3D graph", e);
      }
    };

    if (is3D) init3D();
    else destroy3D();

    return () => {
      mounted = false;
      destroy3D();
    };
  }, [is3D, data, loading, onNodeClick, onNodeRightClick]);

  return (
    <div className={`graph-visualization ${is3D ? "is-3d" : ""}`}>
      <div className="graph-controls">
        <button
          className={`toggle-3d-btn ${is3D ? "active" : ""}`}
          onClick={() => setIs3D((s) => !s)}
          title={is3D ? "切换回 2D 视图" : "切换到 3D 效果"}
        >
          {is3D ? "3D" : "2D"}
        </button>
      </div>
      {is3D ? (
        <div
          className="graph-3d-container"
          ref={fgContainerRef}
          style={{ height: "600px", width: "100%" }}
        />
      ) : data && data.nodes && data.nodes.length > 0 ? (
        <ReactECharts
          ref={chartRef}
          option={getOption(is3D)}
          style={{ height: "600px", width: "100%" }}
          onEvents={onEvents}
          notMerge={false}
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
