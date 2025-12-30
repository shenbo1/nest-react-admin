import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Graph, Shape, EventArgs, History } from '@antv/x6';
import type { FlowData, NodeData, NodeType } from '../types';

// 节点样式配置
const nodeStyleConfig: Record<NodeType, {
  shape: string;
  width: number;
  height: number;
  attrs: {
    body: Record<string, string | number>;
    label: Record<string, string | number>;
  };
}> = {
  START: {
    shape: 'circle',
    width: 60,
    height: 60,
    attrs: {
      body: {
        fill: '#52c41a',
        stroke: '#389e0d',
        strokeWidth: 2,
      },
      label: {
        text: '开始',
        fill: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
  },
  END: {
    shape: 'circle',
    width: 60,
    height: 60,
    attrs: {
      body: {
        fill: '#ff4d4f',
        stroke: '#cf1322',
        strokeWidth: 2,
      },
      label: {
        text: '结束',
        fill: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
  },
  APPROVAL: {
    shape: 'rect',
    width: 120,
    height: 48,
    attrs: {
      body: {
        fill: '#e6f7ff',
        stroke: '#1890ff',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        fill: '#1890ff',
        fontSize: 14,
      },
    },
  },
  CONDITION: {
    shape: 'polygon',
    width: 100,
    height: 60,
    attrs: {
      body: {
        fill: '#fff7e6',
        stroke: '#fa8c16',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
      },
      label: {
        fill: '#fa8c16',
        fontSize: 12,
      },
    },
  },
  PARALLEL: {
    shape: 'rect',
    width: 120,
    height: 36,
    attrs: {
      body: {
        fill: '#f9f0ff',
        stroke: '#722ed1',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        fill: '#722ed1',
        fontSize: 14,
      },
    },
  },
  JOIN: {
    shape: 'rect',
    width: 120,
    height: 36,
    attrs: {
      body: {
        fill: '#f9f0ff',
        stroke: '#722ed1',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        fill: '#722ed1',
        fontSize: 14,
      },
    },
  },
};

// 根据节点类型获取样式
const getNodeStyle = (nodeType: NodeType | undefined, label?: string): {
  shape: string;
  width: number;
  height: number;
  attrs: {
    body: Record<string, string | number>;
    label: Record<string, string | number>;
  };
} => {
  const defaultStyle = nodeStyleConfig.APPROVAL;
  const style = nodeType ? nodeStyleConfig[nodeType] : defaultStyle;

  return {
    shape: style.shape,
    width: style.width,
    height: style.height,
    attrs: {
      body: { ...style.attrs.body },
      label: {
        ...style.attrs.label,
        text: label || style.attrs.label.text || '节点',
      },
    },
  };
};

// 连接桩配置
const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#1890ff',
          strokeWidth: 1,
          fill: '#fff',
        },
      },
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#1890ff',
          strokeWidth: 1,
          fill: '#fff',
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#1890ff',
          strokeWidth: 1,
          fill: '#fff',
        },
      },
    },
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#1890ff',
          strokeWidth: 1,
          fill: '#fff',
        },
      },
    },
  },
  items: [
    { id: 'port-top', group: 'top' },
    { id: 'port-right', group: 'right' },
    { id: 'port-bottom', group: 'bottom' },
    { id: 'port-left', group: 'left' },
  ],
};

interface FlowCanvasProps {
  flowData: FlowData;
  onChange: (data: FlowData) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeDelete?: (nodeId: string) => void;
  selectedNodeId: string | null;
}

export interface FlowCanvasRef {
  addNode: (node: { id: string; x: number; y: number; data: NodeData }) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: NodeData) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const FlowCanvas = forwardRef<FlowCanvasRef, FlowCanvasProps>(
  ({ flowData, onChange, onNodeSelect, onNodeDelete, selectedNodeId }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);
    const isInternalChangeRef = useRef(false);
    const initializedRef = useRef(false);
    const selectedEdgeIdRef = useRef<string | null>(null);
    const selectedNodeIdRef = useRef<string | null>(null);

    // 保存回调函数的引用，解决闭包问题
    const onChangeRef = useRef(onChange);
    const onNodeSelectRef = useRef(onNodeSelect);
    const onNodeDeleteRef = useRef(onNodeDelete);

    // 更新 ref
    useEffect(() => {
      onChangeRef.current = onChange;
      onNodeSelectRef.current = onNodeSelect;
      onNodeDeleteRef.current = onNodeDelete;
    }, [onChange, onNodeSelect, onNodeDelete]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      addNode: (node) => {
        if (!graphRef.current) return;
        isInternalChangeRef.current = true;
        const style = getNodeStyle(node.data?.nodeType, node.data?.label);
        graphRef.current.addNode({
          id: node.id,
          shape: style.shape,
          x: node.x,
          y: node.y,
          width: style.width,
          height: style.height,
          attrs: style.attrs,
          ports,
          data: node.data,
        });
      },
      removeNode: (nodeId: string) => {
        if (!graphRef.current) return;
        isInternalChangeRef.current = true;
        const node = graphRef.current.getCellById(nodeId);
        if (node) {
          node.remove();
        }
      },
      // 更新节点数据（同步配置到 X6 Graph）
      updateNodeData: (nodeId: string, data: NodeData) => {
        if (!graphRef.current) return;
        const node = graphRef.current.getCellById(nodeId);
        if (node) {
          // 更新节点的 data
          node.setData(data, { overwrite: true });
          // 更新节点标签显示
          node.attr('label/text', data.label || '节点');
        }
      },
      // 缩放方法
      zoomIn: () => {
        if (!graphRef.current) return;
        graphRef.current.zoom(0.1);
      },
      zoomOut: () => {
        if (!graphRef.current) return;
        graphRef.current.zoom(-0.1);
      },
      zoomToFit: () => {
        if (!graphRef.current) return;
        graphRef.current.zoomToFit({ padding: 20, maxScale: 1 });
      },
      resetZoom: () => {
        if (!graphRef.current) return;
        graphRef.current.zoom(1);
        graphRef.current.centerContent();
      },
      // 历史记录方法（需要启用 history 插件）
      undo: () => {
        if (!graphRef.current) return;
        if (graphRef.current.canUndo()) {
          graphRef.current.undo();
        }
      },
      redo: () => {
        if (!graphRef.current) return;
        if (graphRef.current.canRedo()) {
          graphRef.current.redo();
        }
      },
      canUndo: () => {
        if (!graphRef.current) return false;
        return graphRef.current.canUndo();
      },
      canRedo: () => {
        if (!graphRef.current) return false;
        return graphRef.current.canRedo();
      },
    }));

    // 转换 X6 数据格式到 FlowData
    const convertToFlowData = (graph: Graph): FlowData => {
      const nodes: FlowData['nodes'] = [];
      const edges: FlowData['edges'] = [];

      graph.getNodes().forEach((node) => {
        const pos = node.getPosition();
        const nodeData = node.getData() as NodeData;
        nodes.push({
          id: node.id,
          type: node.shape || 'rect',
          x: pos.x,
          y: pos.y,
          data: nodeData,
        });
      });

      graph.getEdges().forEach((edge) => {
        const source = edge.getSource() as { cell?: string; port?: string } | string;
        const target = edge.getTarget() as { cell?: string; port?: string } | string;
        if (source && target) {
          edges.push({
            id: edge.id,
            source: typeof source === 'string' ? source : source.cell || '',
            target: typeof target === 'string' ? target : target.cell || '',
            sourcePort: typeof source === 'object' ? source.port : undefined,
            targetPort: typeof target === 'object' ? target.port : undefined,
          });
        }
      });

      return { nodes, edges };
    };

    // 同步数据到父组件
    const syncToParent = useCallback(() => {
      if (!graphRef.current) return;
      isInternalChangeRef.current = true;
      const data = convertToFlowData(graphRef.current);
      onChangeRef.current(data);
      // 重置标志
      setTimeout(() => {
        isInternalChangeRef.current = false;
      }, 100);
    }, []);

    // 初始化图表
    useEffect(() => {
      if (!containerRef.current) return;

      const graph = new Graph({
        container: containerRef.current,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        background: {
          color: '#f5f5f5',
        },
        grid: {
          size: 20,
          visible: true,
          type: 'dot',
        },
        // 启用鼠标滚轮缩放
        mousewheel: {
          enabled: true,
          modifiers: ['ctrl', 'meta'],
          minScale: 0.5,
          maxScale: 2,
        },
        // 启用画布平移
        panning: {
          enabled: true,
          modifiers: ['shift'],
        },
        connecting: {
          router: 'orth',
          connector: 'rounded',
          allowBlank: false,
          allowLoop: false,
          allowNode: false,
          allowEdge: false,
          allowPort: true,
          highlight: true,
          anchor: 'center',
          connectionPoint: 'anchor',
          snap: {
            radius: 30,
          },
          validateConnection({ sourcePort, targetPort }) {
            // 只允许从连接桩连接到连接桩
            return !!sourcePort && !!targetPort;
          },
          createEdge() {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: '#1890ff',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                  },
                },
              },
              zIndex: 0,
            });
          },
        },
      });

      // 注册历史记录插件
      graph.use(
        new History({
          enabled: true,
        })
      );

      // 监听节点点击
      graph.on('node:click', ({ node }: EventArgs['node:click']) => {
        selectedNodeIdRef.current = node.id;
        selectedEdgeIdRef.current = null; // 取消边选择
        onNodeSelectRef.current(node.id);
        // 让画布容器获取焦点，以便键盘事件生效
        containerRef.current?.focus();
      });

      // 监听边点击
      graph.on('edge:click', ({ edge }) => {
        selectedEdgeIdRef.current = edge.id;
        selectedNodeIdRef.current = null; // 取消节点选择
        onNodeSelectRef.current(null);
        graph.getEdges().forEach((e) => {
          if (e.id === edge.id) {
            e.attr('line/stroke', '#52c41a');
            e.attr('line/strokeWidth', 3);
          } else {
            e.attr('line/stroke', '#1890ff');
            e.attr('line/strokeWidth', 2);
          }
        });
        // 让画布容器获取焦点，以便键盘事件生效
        containerRef.current?.focus();
      });

      // 监听画布点击（取消选择）
      graph.on('canvas:click', () => {
        onNodeSelectRef.current(null);
        selectedEdgeIdRef.current = null;
        selectedNodeIdRef.current = null;
        graph.getEdges().forEach((e) => {
          e.attr('line/stroke', '#1890ff');
          e.attr('line/strokeWidth', 2);
        });
      });

      // 监听键盘事件
      const handleKeyDown = (e: KeyboardEvent) => {
        // 避免在输入框中触发
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        // Ctrl+Z 撤销
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (graph.canUndo()) {
            graph.undo();
            syncToParent();
          }
          return;
        }

        // Ctrl+Shift+Z 或 Ctrl+Y 重做
        if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
          e.preventDefault();
          if (graph.canRedo()) {
            graph.redo();
            syncToParent();
          }
          return;
        }

        // Delete 或 Backspace 删除
        if (e.key === 'Delete' || e.key === 'Backspace') {
          // 删除选中的边
          if (selectedEdgeIdRef.current) {
            const edge = graph.getCellById(selectedEdgeIdRef.current);
            if (edge) {
              isInternalChangeRef.current = true;
              edge.remove();
              selectedEdgeIdRef.current = null;
              syncToParent();
            }
            return;
          }

          // 删除选中的节点
          if (selectedNodeIdRef.current) {
            const node = graph.getCellById(selectedNodeIdRef.current);
            if (node) {
              const nodeData = node.getData() as NodeData;
              // 不允许删除开始和结束节点
              if (nodeData?.nodeType === 'START' || nodeData?.nodeType === 'END') {
                return;
              }
              isInternalChangeRef.current = true;
              node.remove();
              // 通知父组件
              if (onNodeDeleteRef.current) {
                onNodeDeleteRef.current(selectedNodeIdRef.current);
              }
              selectedNodeIdRef.current = null;
              onNodeSelectRef.current(null);
              syncToParent();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // 监听节点移动完成
      graph.on('node:moved', () => {
        syncToParent();
      });

      // 监听边的添加
      graph.on('edge:connected', () => {
        syncToParent();
      });

      // 监听边的删除
      graph.on('edge:removed', () => {
        syncToParent();
      });

      // 监听节点添加
      graph.on('node:added', () => {
        syncToParent();
      });

      // 监听节点删除
      graph.on('node:removed', () => {
        syncToParent();
      });

      graphRef.current = graph;

      // 窗口大小变化
      const handleResize = () => {
        if (containerRef.current && graph) {
          graph.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('keydown', handleKeyDown);
        graph.dispose();
      };
    }, []);

    // 加载流程数据（只在初始化或外部数据变化时）
    useEffect(() => {
      if (!graphRef.current) return;

      // 如果是内部变化触发的，跳过
      if (isInternalChangeRef.current) {
        return;
      }

      // 如果已初始化且节点数量相同，跳过（避免拖动时重新渲染）
      if (initializedRef.current && graphRef.current.getNodes().length === flowData.nodes.length) {
        return;
      }

      const cells = [
        ...flowData.nodes.map((n) => {
          const style = getNodeStyle(n.data?.nodeType, n.data?.label);
          return {
            id: n.id,
            shape: style.shape,
            x: n.x || 100,
            y: n.y || 100,
            width: style.width,
            height: style.height,
            attrs: style.attrs,
            ports,
            data: n.data,
          };
        }),
        ...flowData.edges.map((e) => ({
          id: e.id,
          shape: 'edge',
          source: e.sourcePort ? { cell: e.source, port: e.sourcePort } : e.source,
          target: e.targetPort ? { cell: e.target, port: e.targetPort } : e.target,
          router: 'orth',
          connector: 'rounded',
          attrs: {
            line: {
              stroke: '#1890ff',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
        })),
      ];

      graphRef.current.fromJSON({ cells });
      initializedRef.current = true;
    }, [flowData]);

    // 更新选中节点样式
    useEffect(() => {
      if (!graphRef.current) return;

      const graph = graphRef.current;
      graph.getNodes().forEach((node) => {
        const nodeData = node.getData() as NodeData | undefined;
        const nodeType = nodeData?.nodeType;
        const originalStyle = nodeType ? nodeStyleConfig[nodeType] : nodeStyleConfig.APPROVAL;
        const originalStroke = originalStyle.attrs.body.stroke as string;

        if (node.id === selectedNodeId) {
          node.attr('body/stroke', '#52c41a');
          node.attr('body/strokeWidth', 3);
        } else {
          node.attr('body/stroke', originalStroke);
          node.attr('body/strokeWidth', 2);
        }
      });
    }, [selectedNodeId]);

    return (
      <div
        ref={containerRef}
        tabIndex={0}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 500,
          outline: 'none',
        }}
      />
    );
  }
);

FlowCanvas.displayName = 'FlowCanvas';

export default FlowCanvas;
