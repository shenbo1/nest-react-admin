import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tabs,
  Drawer,
  message,
  Spin,
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import FlowCanvas, { type FlowCanvasRef } from './components/FlowCanvas';
import NodePanel from './components/NodePanel';
import NodeConfigPanel from './components/NodeConfigPanel';
import FormDesigner from './components/FormDesigner';
import FlowConfigPanel from './components/FlowConfigPanel';
import type {
  FlowData,
  NodeData,
  NodeConfigDto,
  FormField,
  NodeTemplate,
  FlowDefinitionDetail,
  NodeConfigFromDb,
} from './types';
import {
  DEFAULT_NODE_POSITIONS,
} from './nodeTemplates';
import {
  getFlowDefinition,
  createFlowDefinition,
  updateFlowDefinition,
  saveNodeConfigs,
  publishFlowDefinition,
} from '@/services/workflow/definition';
import { queryCategoryTree, type CategoryTreeNode } from '@/services/workflow/category';

type ActiveTab = 'design' | 'form' | 'config';

const FlowDesigner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  // 加载状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 流程基本信息
  const [flowName, setFlowName] = useState('');
  const [flowCode, setFlowCode] = useState('');
  const [flowStatus, setFlowStatus] = useState<string>('DRAFT');
  const [categoryId, setCategoryId] = useState<number>();
  const [description, setDescription] = useState('');
  const [businessTable, setBusinessTable] = useState('');

  // 流程数据
  const [flowData, setFlowData] = useState<FlowData>({ nodes: [], edges: [] });
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [nodeConfigs, setNodeConfigs] = useState<NodeConfigDto[]>([]);

  // 选中节点
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);

  // FlowCanvas ref
  const canvasRef = useRef<FlowCanvasRef>(null);

  // Drawer 状态
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('design');

  // 获取节点数据
  const getSelectedNodeData = useCallback((): NodeData | null => {
    if (!selectedNodeId) return null;
    const node = flowData.nodes.find((n) => n.id === selectedNodeId);
    return node?.data || null;
  }, [selectedNodeId, flowData]);

  // 加载数据
  useEffect(() => {
    loadCategories();
    if (!isNew) {
      loadFlowDefinition();
    }
  }, [id]);

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const res = await queryCategoryTree();
      setCategories(res?.list || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  // 加载流程定义
  const loadFlowDefinition = async () => {
    if (!id || isNew) return;

    setLoading(true);
    try {
      const data = await getFlowDefinition(parseInt(id, 10)) as FlowDefinitionDetail;

      setFlowName(data.name);
      setFlowCode(data.code);
      setFlowStatus(data.status || 'DRAFT');
      setCategoryId(data.categoryId);
      setDescription(data.description || '');
      setBusinessTable(data.businessTable || '');

      // 加载表单字段
      if (data.formData) {
        setFormFields(data.formData);
      }

      // 加载节点配置
      let configs: NodeConfigDto[] = [];
      if (data.nodeConfigs && data.nodeConfigs.length > 0) {
        configs = data.nodeConfigs.map((nc: NodeConfigFromDb) => ({
          nodeId: nc.nodeId,
          nodeType: nc.nodeType as 'START' | 'END' | 'APPROVAL' | 'CONDITION' | 'PARALLEL' | 'JOIN',
          nodeName: nc.nodeName,
          approvalType: nc.approvalType as 'OR_SIGN' | 'AND_SIGN' | undefined,
          assigneeType: nc.assigneeType as 'ROLE' | 'DEPT_LEADER' | 'SPECIFIC_USER' | 'INITIATOR_LEADER' | 'FORM_FIELD' | undefined,
          assigneeConfig: nc.assigneeConfig,
          emptyAssigneeAction: nc.emptyAssigneeAction as 'SKIP' | 'TO_ADMIN' | 'ERROR' | undefined,
          conditionExpr: nc.conditionExpr,
          formPerms: nc.formPerms,
          timeLimit: nc.timeLimit,
          timeoutAction: nc.timeoutAction as 'AUTO_PASS' | 'AUTO_REJECT' | 'REMIND' | undefined,
          ccConfig: nc.ccConfig,
        }));
        setNodeConfigs(configs);
      }

      // 加载流程图数据，并合并节点配置到节点数据中
      if (data.flowData) {
        const mergedFlowData: FlowData = {
          ...data.flowData,
          nodes: data.flowData.nodes.map((node) => {
            const config = configs.find((c) => c.nodeId === node.id);
            if (config) {
              return {
                ...node,
                data: {
                  ...node.data,
                  label: config.nodeName || node.data?.label,
                  approvalType: config.approvalType,
                  assigneeType: config.assigneeType,
                  assigneeConfig: config.assigneeConfig,
                  emptyAssigneeAction: config.emptyAssigneeAction,
                  conditionExpr: config.conditionExpr,
                  timeLimit: config.timeLimit,
                  timeoutAction: config.timeoutAction,
                  ccConfig: config.ccConfig,
                } as NodeData,
              };
            }
            return node;
          }),
        };
        setFlowData(mergedFlowData);
      }
    } catch (error) {
      message.error('加载流程定义失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 添加节点
  const handleAddNode = useCallback(
    (template: NodeTemplate, position?: { x: number; y: number }) => {
      const newNodeId = `${template.type.toLowerCase()}_${Date.now()}`;
      const nodeData: NodeData = {
        label: template.label,
        nodeType: template.type as NodeData['nodeType'],
      };

      // 通过 ref 调用子组件的方法添加节点
      canvasRef.current?.addNode({
        id: newNodeId,
        x: position?.x ?? DEFAULT_NODE_POSITIONS[template.type]?.x ?? 300,
        y: position?.y ?? DEFAULT_NODE_POSITIONS[template.type]?.y ?? 250,
        data: nodeData,
      });

      setSelectedNodeId(newNodeId);
    },
    [],
  );

  // 删除节点
  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;

    // 从画布中删除节点
    canvasRef.current?.removeNode(selectedNodeId);

    // 更新状态
    setFlowData((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== selectedNodeId),
      edges: prev.edges.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      ),
    }));

    setSelectedNodeId(null);
  }, [selectedNodeId]);

  // 更新节点配置
  const handleSaveNodeConfig = useCallback(
    (config: NodeConfigDto) => {
      // 更新节点配置列表
      setNodeConfigs((prev) => {
        const filtered = prev.filter((c) => c.nodeId !== config.nodeId);
        return [...filtered, config];
      });

      // 构建新的节点数据
      const newNodeData: NodeData = {
        nodeType: config.nodeType,
        label: config.nodeName,
        approvalType: config.approvalType,
        assigneeType: config.assigneeType,
        assigneeConfig: config.assigneeConfig,
        emptyAssigneeAction: config.emptyAssigneeAction,
        conditionExpr: config.conditionExpr,
        timeLimit: config.timeLimit,
        timeoutAction: config.timeoutAction,
        ccConfig: config.ccConfig,
      };

      // 同步更新 X6 Graph 内部的节点数据
      canvasRef.current?.updateNodeData(config.nodeId, newNodeData);

      // 更新 React 状态中的节点数据
      setFlowData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => {
          if (n.id === config.nodeId) {
            return {
              ...n,
              data: {
                ...(n.data || { nodeType: config.nodeType }),
                ...newNodeData,
              },
            };
          }
          return n;
        }),
      }));
    },
    [],
  );

  // 保存流程
  const handleSave = async () => {
    if (!flowName) {
      message.warning('请填写流程名称');
      return;
    }
    if (!flowCode) {
      message.warning('请填写流程编码');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: flowName,
        code: flowCode,
        categoryId,
        description,
        businessTable,
        flowData,
        formData: formFields,
      };

      let flowId: number;

      if (isNew) {
        const res = await createFlowDefinition(data);
        flowId = (res as any).id;
        message.success('创建成功');
      } else {
        await updateFlowDefinition(parseInt(id as string, 10), data);
        flowId = parseInt(id as string, 10);
        message.success('保存成功');
      }

      // 保存节点配置
      if (nodeConfigs.length > 0) {
        await saveNodeConfigs(flowId, nodeConfigs);
      }

      // 如果是新建，跳转到编辑页面
      if (isNew) {
        navigate(`/workflow/definition/design/${flowId}`, { replace: true });
      }
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 校验发布前的数据
  const validateBeforePublish = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. 校验流程属性
    if (!flowName) {
      errors.push('请填写流程名称');
    }
    if (!flowCode) {
      errors.push('请填写流程编码');
    }

    // 2. 校验流程设计
    if (!flowData.nodes || flowData.nodes.length === 0) {
      errors.push('流程设计：请至少添加一个节点');
    } else {
      // 检查是否有开始节点（nodeType 存储在 data 中，且是大写）
      const hasStartNode = flowData.nodes.some((node) => node.data?.nodeType === 'START');
      if (!hasStartNode) {
        errors.push('流程设计：请添加开始节点');
      }

      // 检查是否有结束节点
      const hasEndNode = flowData.nodes.some((node) => node.data?.nodeType === 'END');
      if (!hasEndNode) {
        errors.push('流程设计：请添加结束节点');
      }

      // 检查是否有审批节点
      const hasApprovalNode = flowData.nodes.some((node) => node.data?.nodeType === 'APPROVAL');
      if (!hasApprovalNode) {
        errors.push('流程设计：请至少添加一个审批节点');
      }

      // 检查节点之间是否有连线
      if (!flowData.edges || flowData.edges.length === 0) {
        errors.push('流程设计：请连接节点');
      }
    }

    // 3. 校验表单设计
    if (!formFields || formFields.length === 0) {
      errors.push('表单设计：请至少添加一个表单字段');
    } else {
      // 检查下拉选择字段是否配置了选项
      const selectFieldsWithoutOptions = formFields.filter(
        (field) =>
          field.fieldType === 'select' &&
          !field.dictType &&
          (!field.options || field.options.length === 0)
      );
      if (selectFieldsWithoutOptions.length > 0) {
        const fieldNames = selectFieldsWithoutOptions.map((f) => f.fieldLabel).join('、');
        errors.push(`表单设计：下拉字段「${fieldNames}」未配置选项`);
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // 保存并发布流程
  const handleSaveAndPublish = async () => {
    // 发布前校验
    const { valid, errors } = validateBeforePublish();
    if (!valid) {
      message.error({
        content: (
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: 8 }}>发布前请完善以下内容：</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 5,
      });
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: flowName,
        code: flowCode,
        categoryId,
        description,
        businessTable,
        flowData,
        formData: formFields,
      };

      let flowId: number;

      if (isNew) {
        const res = await createFlowDefinition(data);
        flowId = (res as any).id;
      } else {
        await updateFlowDefinition(parseInt(id as string, 10), data);
        flowId = parseInt(id as string, 10);
      }

      // 保存节点配置
      if (nodeConfigs.length > 0) {
        await saveNodeConfigs(flowId, nodeConfigs);
      }

      // 调用发布接口
      await publishFlowDefinition(flowId);
      message.success('保存并发布成功');
      setFlowStatus('PUBLISHED');

      // 如果是新建，跳转到编辑页面
      if (isNew) {
        navigate(`/workflow/definition/design/${flowId}`, { replace: true });
      }
    } catch (error) {
      message.error('保存并发布失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 拖拽处理
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const template = JSON.parse(data) as NodeTemplate;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleAddNode(template, { x, y });
      } catch (error) {
        console.error('解析拖拽数据失败:', error);
      }
    },
    [handleAddNode],
  );


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card
      title={isNew ? '新建流程' : `编辑流程 - ${flowName}`}
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          {flowStatus !== 'PUBLISHED' && (
            <>
              <Button icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存
              </Button>
              <Button type="primary" loading={saving} onClick={handleSaveAndPublish}>
                保存并发布
              </Button>
            </>
          )}
        </Space>
      }
      bodyStyle={{ padding: 0, height: 'calc(100vh - 180px)' }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ActiveTab)}
        style={{ height: '100%' }}
        items={[
          {
            key: 'design',
            label: '流程设计',
            children: (
              <div style={{ display: 'flex', height: 'calc(100% - 46px)' }}>
                {/* 左侧节点面板 */}
                <div style={{ width: 200, borderRight: '1px solid #f0f0f0' }}>
                  <NodePanel onAddNode={handleAddNode} />
                </div>

                {/* 中间画布 */}
                <div
                  style={{ flex: 1, position: 'relative' }}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div style={{ position: 'absolute', right: 8, top: 8, zIndex: 10 }}>
                    <Space>
                      <Tooltip title="撤销 (Ctrl+Z)">
                        <Button
                          size="small"
                          icon={<UndoOutlined />}
                          onClick={() => canvasRef.current?.undo()}
                        />
                      </Tooltip>
                      <Tooltip title="重做 (Ctrl+Shift+Z)">
                        <Button
                          size="small"
                          icon={<RedoOutlined />}
                          onClick={() => canvasRef.current?.redo()}
                        />
                      </Tooltip>
                      <Tooltip title="放大">
                        <Button
                          size="small"
                          icon={<ZoomInOutlined />}
                          onClick={() => canvasRef.current?.zoomIn()}
                        />
                      </Tooltip>
                      <Tooltip title="缩小">
                        <Button
                          size="small"
                          icon={<ZoomOutOutlined />}
                          onClick={() => canvasRef.current?.zoomOut()}
                        />
                      </Tooltip>
                      <Tooltip title="适应画布">
                        <Button
                          size="small"
                          icon={<FullscreenOutlined />}
                          onClick={() => canvasRef.current?.zoomToFit()}
                        />
                      </Tooltip>
                      <Button size="small" icon={<EyeOutlined />} onClick={() => setConfigDrawerOpen(true)}>
                        属性
                      </Button>
                    </Space>
                  </div>
                  <FlowCanvas
                    ref={canvasRef}
                    flowData={flowData}
                    onChange={setFlowData}
                    onNodeSelect={setSelectedNodeId}
                    onNodeDelete={(nodeId) => {
                      // 删除节点配置
                      setNodeConfigs((prev) => prev.filter((c) => c.nodeId !== nodeId));
                    }}
                    selectedNodeId={selectedNodeId}
                  />
                </div>

                {/* 右侧配置面板 */}
                <div style={{ width: 320, borderLeft: '1px solid #f0f0f0', overflow: 'auto' }}>
                  <NodeConfigPanel
                    nodeId={selectedNodeId}
                    nodeData={getSelectedNodeData()}
                    formFields={formFields}
                    readOnly={flowStatus === 'PUBLISHED'}
                    onSave={handleSaveNodeConfig}
                    onDelete={handleDeleteNode}
                  />
                  {flowStatus !== 'PUBLISHED' && (
                    <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
                      <Button
                        block
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                      >
                        保存
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'form',
            label: '表单设计',
            children: (
              <div style={{ padding: 16, overflow: 'auto', height: 'calc(100% - 46px)' }}>
                <FormDesigner
                  formFields={formFields}
                  onChange={setFormFields}
                  readOnly={flowStatus === 'PUBLISHED'}
                />
                {flowStatus !== 'PUBLISHED' && (
                  <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={saving}
                      onClick={handleSave}
                    >
                      保存
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'config',
            label: '流程属性',
            children: (
              <div style={{ padding: 16, overflow: 'auto', height: 'calc(100% - 46px)' }}>
                <FlowConfigPanel
                  flowName={flowName}
                  flowCode={flowCode}
                  categoryId={categoryId}
                  description={description}
                  businessTable={businessTable}
                  categories={categories}
                  readOnly={flowStatus === 'PUBLISHED'}
                  onChange={(field, value) => {
                    switch (field) {
                      case 'name':
                        setFlowName(value as string);
                        break;
                      case 'code':
                        setFlowCode(value as string);
                        break;
                      case 'categoryId':
                        setCategoryId(value as number);
                        break;
                      case 'description':
                        setDescription(value as string);
                        break;
                      case 'businessTable':
                        setBusinessTable(value as string);
                        break;
                    }
                  }}
                />
              </div>
            ),
          },
        ]}
      />

      {/* 属性抽屉 */}
      <Drawer
        title="流程属性"
        placement="right"
        width={400}
        open={configDrawerOpen}
        onClose={() => setConfigDrawerOpen(false)}
      >
        <FlowConfigPanel
          flowName={flowName}
          flowCode={flowCode}
          categoryId={categoryId}
          description={description}
          businessTable={businessTable}
          categories={categories}
          readOnly={flowStatus === 'PUBLISHED'}
          onChange={(field, value) => {
            switch (field) {
              case 'name':
                setFlowName(value as string);
                break;
              case 'code':
                setFlowCode(value as string);
                break;
              case 'categoryId':
                setCategoryId(value as number);
                break;
              case 'description':
                setDescription(value as string);
                break;
              case 'businessTable':
                setBusinessTable(value as string);
                break;
            }
          }}
        />
      </Drawer>
    </Card>
  );
};

export default FlowDesigner;
