import React from 'react';
import { Card, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  BranchesOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { nodeTemplates } from '../nodeTemplates';
import type { NodeTemplate } from '../types';

interface NodePanelProps {
  onAddNode: (template: NodeTemplate) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  PlayCircleOutlined: <PlayCircleOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  BranchesOutlined: <BranchesOutlined />,
  FullscreenOutlined: <FullscreenOutlined />,
  FullscreenExitOutlined: <FullscreenExitOutlined />,
  StopOutlined: <StopOutlined />,
};

const NodePanel: React.FC<NodePanelProps> = () => {
  const handleDragStart = (_e: React.DragEvent, template: NodeTemplate) => {
    _e.dataTransfer.setData('application/json', JSON.stringify(template));
    _e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Card
      title="节点库"
      size="small"
      bodyStyle={{ padding: '12px' }}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {nodeTemplates.map((template) => (
          <Tooltip
            key={template.type}
            title={template.description}
            placement="right"
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#fafafa',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                cursor: 'grab',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = template.color;
                e.currentTarget.style.boxShadow = `0 2px 4px ${template.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span
                style={{
                  color: template.color,
                  fontSize: 18,
                  marginRight: 8,
                }}
              >
                {iconMap[template.icon]}
              </span>
              <span style={{ fontSize: 13 }}>{template.label}</span>
            </div>
          </Tooltip>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '8px 12px', backgroundColor: '#f0f5ff', borderRadius: 6 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#1890ff' }}>
          💡 提示：拖拽节点到画布中即可添加
        </p>
      </div>
    </Card>
  );
};

export default NodePanel;
