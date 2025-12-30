import { ProCard } from '@ant-design/pro-components';
import { Form, Input, TreeSelect } from 'antd';
import type { CategoryTreeNode } from '@/services/workflow/category';

interface FlowConfigPanelProps {
  flowName: string;
  flowCode: string;
  categoryId?: number;
  description?: string;
  businessTable?: string;
  categories: CategoryTreeNode[];
  readOnly: boolean;
  onChange: (field: string, value: unknown) => void;
}

// 转换分类树为 TreeSelect 格式
const transformCategoryTree = (nodes: CategoryTreeNode[]): any[] => {
  return nodes.map((node) => ({
    value: node.id,
    title: node.name,
    children: node.children && node.children.length > 0
      ? transformCategoryTree(node.children)
      : undefined,
  }));
};

const FlowConfigPanel: React.FC<FlowConfigPanelProps> = ({
  flowName,
  flowCode,
  categoryId,
  description,
  businessTable,
  categories,
  readOnly,
  onChange,
}) => {
  const treeData = transformCategoryTree(categories);

  return (
    <ProCard title="流程属性" headerBordered>
      <Form layout="vertical" size="small">
        <Form.Item label="流程名称" required>
          <Input
            value={flowName}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="请输入流程名称"
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item label="流程编码" required>
          <Input
            value={flowCode}
            onChange={(e) => onChange('code', e.target.value)}
            placeholder="请输入流程编码"
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item label="流程分类">
          <TreeSelect
            value={categoryId}
            onChange={(value) => onChange('categoryId', value)}
            placeholder="请选择分类"
            treeData={treeData}
            treeDefaultExpandAll
            disabled={readOnly}
            allowClear
          />
        </Form.Item>

        <Form.Item label="关联业务表">
          <Input
            value={businessTable}
            onChange={(e) => onChange('businessTable', e.target.value)}
            placeholder="如：leave_request"
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item label="流程描述">
          <Input.TextArea
            value={description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="请输入流程描述"
            rows={3}
            disabled={readOnly}
          />
        </Form.Item>
      </Form>
    </ProCard>
  );
};

export default FlowConfigPanel;
