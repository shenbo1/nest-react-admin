import { useEffect, useState } from 'react';
import { ProCard } from '@ant-design/pro-components';
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Divider,
  message,
  Popconfirm,
  InputNumber,
} from 'antd';
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type {
  NodeData,
  AssigneeType,
  NodeConfigDto,
  FormField,
} from '../types';
import {
  approvalTypeOptions,
  assigneeTypeOptions,
  emptyAssigneeActionOptions,
  conditionOperatorOptions,
  timeoutActionOptions,
} from '../nodeTemplates';
import { roleApi, userApi } from '@/services/system/system';

interface NodeConfigPanelProps {
  nodeId: string | null;
  nodeData: NodeData | null;
  formFields: FormField[];
  readOnly: boolean;
  onSave: (config: NodeConfigDto) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  nodeId,
  nodeData,
  formFields,
  readOnly,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<{ label: string; value: number }[]>([]);
  const [users, setUsers] = useState<{ label: string; value: number }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (nodeData) {
      form.setFieldsValue({
        label: nodeData.label,
        nodeType: nodeData.nodeType,
        approvalType: nodeData.approvalType,
        assigneeType: nodeData.assigneeType,
        emptyAssigneeAction: nodeData.emptyAssigneeAction,
        timeLimit: nodeData.timeLimit,
        timeoutAction: nodeData.timeoutAction,
        // 审批人配置
        roleIds: nodeData.assigneeConfig?.roleIds,
        userIds: nodeData.assigneeConfig?.userIds,
        deptLevel: nodeData.assigneeConfig?.deptLevel,
        fieldName: nodeData.assigneeConfig?.fieldName,
        // 条件配置
        conditionField: nodeData.conditionExpr?.field,
        conditionOperator: nodeData.conditionExpr?.operator,
        conditionValue: nodeData.conditionExpr?.value,
        // 抄送配置
        ccEnable: nodeData.ccConfig?.enable,
        ccType: nodeData.ccConfig?.type,
        ccUserIds: nodeData.ccConfig?.userIds,
        ccRoleIds: nodeData.ccConfig?.roleIds,
      });
    }
  }, [nodeData, form]);

  // 加载角色列表
  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true);
      try {
        const data = await roleApi.simple();
        setRoles(data.map(role => ({
          label: role.name,
          value: role.id
        })));
      } catch (error) {
        console.error('加载角色列表失败:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []);

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const result = await userApi.list({ page: 1, pageSize: 100 });
        setUsers(result.data.map(user => ({
          label: `${user.nickname || user.username} (${user.username})`,
          value: user.id
        })));
      } catch (error) {
        console.error('加载用户列表失败:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleSave = async () => {
    if (!nodeId || !nodeData) return;

    try {
      const values = await form.validateFields();

      const config: NodeConfigDto = {
        nodeId,
        nodeType: nodeData.nodeType,
        nodeName: values.label,
        approvalType: values.approvalType,
        assigneeType: values.assigneeType,
        emptyAssigneeAction: values.emptyAssigneeAction,
        timeLimit: values.timeLimit,
        timeoutAction: values.timeoutAction,
        assigneeConfig: {
          roleIds: values.roleIds,
          userIds: values.userIds,
          deptLevel: values.deptLevel,
          fieldName: values.fieldName,
        },
        conditionExpr: values.conditionField
          ? {
              type: 'single',
              field: values.conditionField,
              operator: values.conditionOperator,
              value: values.conditionValue,
            }
          : undefined,
        ccConfig: values.ccEnable
          ? {
              enable: true,
              type: values.ccType || 'SPECIFIC_USER',
              userIds: values.ccUserIds,
              roleIds: values.ccRoleIds,
            }
          : undefined,
      };

      onSave(config);
      message.success('保存成功');
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  if (!nodeId || !nodeData) {
    return (
      <ProCard title="节点配置" headerBordered>
        <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>
          请选择一个节点进行配置
        </div>
      </ProCard>
    );
  }

  const isApprovalNode = nodeData.nodeType === 'APPROVAL';
  const isConditionNode = nodeData.nodeType === 'CONDITION';

  return (
    <ProCard
      title={`节点配置 - ${nodeData.label}`}
      headerBordered
      extra={
        <Space>
          {!readOnly && onMoveUp && (
            <Button
              type="text"
              icon={<ArrowUpOutlined />}
              disabled={!canMoveUp}
              onClick={onMoveUp}
            />
          )}
          {!readOnly && onMoveDown && (
            <Button
              type="text"
              icon={<ArrowDownOutlined />}
              disabled={!canMoveDown}
              onClick={onMoveDown}
            />
          )}
          {!readOnly && (
            <Popconfirm title="确定删除此节点？" onConfirm={onDelete}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      }
      bodyStyle={{ padding: 16, maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}
    >
      <Form form={form} layout="vertical" size="small" disabled={readOnly}>
        <Form.Item label="节点名称" name="label" rules={[{ required: true, message: '请输入节点名称' }]}>
          <Input placeholder="请输入节点名称" />
        </Form.Item>

        <Form.Item label="节点类型" name="nodeType">
          <Select disabled options={[{ label: nodeData.nodeType, value: nodeData.nodeType }]} />
        </Form.Item>

        {isApprovalNode && (
          <>
            <Divider>审批设置</Divider>

            <Form.Item label="审批方式" name="approvalType" tooltip="或签：任一审批人通过即可；会签：所有审批人通过才能通过">
              <Select options={approvalTypeOptions} />
            </Form.Item>

            <Form.Item label="审批人来源" name="assigneeType" rules={[{ required: true, message: '请选择审批人来源' }]}>
              <Select options={assigneeTypeOptions} placeholder="请选择审批人来源" />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
              prevValues.assigneeType !== currentValues.assigneeType
            }>
              {({ getFieldValue }) => {
                const assigneeType = getFieldValue('assigneeType') as AssigneeType;

                if (assigneeType === 'ROLE') {
                  return (
                    <Form.Item label="选择角色" name="roleIds">
                      <Select
                        mode="multiple"
                        placeholder="请选择角色"
                        options={roles}
                        loading={loadingRoles}
                      />
                    </Form.Item>
                  );
                }

                if (assigneeType === 'SPECIFIC_USER') {
                  return (
                    <Form.Item label="指定人员" name="userIds">
                      <Select
                        mode="multiple"
                        placeholder="请选择人员"
                        showSearch
                        options={users}
                        loading={loadingUsers}
                      />
                    </Form.Item>
                  );
                }

                if (assigneeType === 'DEPT_LEADER') {
                  return (
                    <Form.Item label="部门层级" name="deptLevel" tooltip="1表示直接领导，2表示上上级领导，以此类推">
                      <InputNumber min={1} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                  );
                }

                if (assigneeType === 'FORM_FIELD') {
                  return (
                    <Form.Item label="表单字段" name="fieldName" tooltip="从表单中选择一个用户类型的字段">
                      <Select
                        placeholder="请选择表单字段"
                        options={formFields
                          .filter((f) => f.fieldType === 'user')
                          .map((f) => ({ label: f.fieldLabel, value: f.fieldName }))}
                      />
                    </Form.Item>
                  );
                }

                if (assigneeType === 'INITIATOR_LEADER') {
                  return (
                    <Form.Item label="上级层级" name="deptLevel" tooltip="1表示直接上级，2表示上上级，以此类推">
                      <InputNumber min={1} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                  );
                }

                return null;
              }}
            </Form.Item>

            <Form.Item label="审批人为空时" name="emptyAssigneeAction">
              <Select options={emptyAssigneeActionOptions} placeholder="请选择处理策略" />
            </Form.Item>

            <Divider>超时设置</Divider>

            <Form.Item label="超时时间（小时）" name="timeLimit">
              <InputNumber min={0} placeholder="0表示不限制" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="超时处理" name="timeoutAction">
              <Select
                allowClear
                placeholder="请选择超时处理方式"
                options={timeoutActionOptions}
              />
            </Form.Item>
          </>
        )}

        {isConditionNode && (
          <>
            <Divider>条件设置</Divider>

            <Form.Item label="条件字段" name="conditionField">
              <Select
                placeholder="请选择条件字段"
                allowClear
                options={formFields.map((f) => ({
                  label: `${f.fieldLabel} (${f.fieldName})`,
                  value: f.fieldName,
                }))}
              />
            </Form.Item>

            <Form.Item label="运算符" name="conditionOperator">
              <Select
                placeholder="请选择运算符"
                allowClear
                options={conditionOperatorOptions}
              />
            </Form.Item>

            <Form.Item label="条件值" name="conditionValue">
              <Input placeholder="请输入条件值" />
            </Form.Item>
          </>
        )}

        <Divider>抄送设置</Divider>

        <Form.Item label="启用抄送" name="ccEnable" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
          prevValues.ccEnable !== currentValues.ccEnable
        }>
          {({ getFieldValue }) => {
            const ccEnable = getFieldValue('ccEnable');
            if (!ccEnable) return null;

            return (
              <>
                <Form.Item label="抄送来源" name="ccType" initialValue="SPECIFIC_USER">
                  <Select
                    options={[
                      { label: '指定人员', value: 'SPECIFIC_USER' },
                      { label: '按角色', value: 'ROLE' },
                    ]}
                  />
                </Form.Item>

                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
                  prevValues.ccType !== currentValues.ccType
                }>
                  {({ getFieldValue: getFieldValue2 }) => {
                    const ccType = getFieldValue2('ccType');
                    if (ccType === 'ROLE') {
                      return (
                        <Form.Item label="选择角色" name="ccRoleIds">
                          <Select
                            mode="multiple"
                            placeholder="请选择角色"
                            options={roles}
                            loading={loadingRoles}
                          />
                        </Form.Item>
                      );
                    }
                    return (
                      <Form.Item label="指定人员" name="ccUserIds">
                        <Select
                          mode="multiple"
                          placeholder="请选择人员"
                          showSearch
                          options={users}
                          loading={loadingUsers}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </>
            );
          }}
        </Form.Item>

        {!readOnly && (
          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" block onClick={handleSave}>
              保存配置
            </Button>
          </Form.Item>
        )}
      </Form>
    </ProCard>
  );
};

export default NodeConfigPanel;
