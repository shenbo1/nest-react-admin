import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormTimePicker,
  ProFormSelect,
  ProFormTreeSelect,
  CheckCard,
  StepsForm,
} from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  Button,
  Space,
  message,
  Empty,
  Spin,
  Tag,
  Result,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import {
  queryAvailableFlowDefinitions,
  getFlowDefinition,
} from '@/services/workflow/definition';
import { queryCategoryTree } from '@/services/workflow/category';
import { startFlow } from '@/services/workflow/instance';
import { userApi, deptApi, dictApi } from '@/services/system/system';
import { useUserStore } from '@/stores/user';
import type { FormField } from '@/pages/workflow/definition/design/types';
import dayjs from 'dayjs';

const { Text } = Typography;

// 生成流程标题
const generateFlowTitle = (flowName: string, userName: string) => {
  const dateStr = dayjs().format('YYYYMMDD');
  return `${userName}的${flowName}-${dateStr}`;
};

interface FlowDefinitionItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  version: number;
  category?: {
    id: number;
    name: string;
    color?: string;
  };
  formData?: FormField[];
}

const StartFlow: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('definitionId');
  const { userInfo } = useUserStore();
  const formRef = useRef<ProFormInstance>();

  const [selectedFlow, setSelectedFlow] = useState<FlowDefinitionItem | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedInstance, setSubmittedInstance] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dictDataMap, setDictDataMap] = useState<Record<string, { label: string; value: string }[]>>({});

  // 获取可用的流程定义列表
  const { data: flowList, isLoading: flowLoading } = useQuery({
    queryKey: ['available-flows', selectedCategory],
    queryFn: () => queryAvailableFlowDefinitions(selectedCategory),
  });

  // 获取分类列表
  const { data: categoryData } = useQuery({
    queryKey: ['workflow-category-tree'],
    queryFn: queryCategoryTree,
  });

  // 发起流程
  const startMutation = useMutation({
    mutationFn: startFlow,
    onSuccess: (data) => {
      message.success('流程发起成功');
      setSubmitted(true);
      setSubmittedInstance(data);
    },
    onError: (error: any) => {
      message.error(error?.message || '流程发起失败');
    },
  });

  // 预选流程
  useEffect(() => {
    if (preSelectedId && flowList?.list) {
      const flow = flowList.list.find(
        (f: FlowDefinitionItem) => f.id === parseInt(preSelectedId),
      );
      if (flow) {
        setSelectedFlow(flow);
      }
    }
  }, [preSelectedId, flowList]);

  // 加载流程详情
  const loadFlowDetail = async (flowId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await getFlowDefinition(flowId);
      if (detail.formData && Array.isArray(detail.formData)) {
        setFormFields(detail.formData);
        // 加载字典数据
        await loadDictData(detail.formData);
      } else {
        setFormFields([]);
        setDictDataMap({});
      }
      return true;
    } catch (error) {
      message.error('获取流程详情失败');
      return false;
    } finally {
      setLoadingDetail(false);
    }
  };

  // 加载字典数据
  const loadDictData = async (fields: FormField[]) => {
    const dictTypes = fields
      .filter((f) => f.fieldType === 'select' && f.optionsSource === 'dict' && f.dictType)
      .map((f) => f.dictType as string);

    if (dictTypes.length === 0) {
      setDictDataMap({});
      return;
    }

    const uniqueDictTypes = [...new Set(dictTypes)];
    const dataMap: Record<string, { label: string; value: string }[]> = {};

    await Promise.all(
      uniqueDictTypes.map(async (dictType) => {
        try {
          const data = await dictApi.getDataByType(dictType);
          dataMap[dictType] = data.map((item) => ({
            label: item.label,
            value: item.value,
          }));
        } catch (error) {
          console.error(`加载字典 ${dictType} 失败:`, error);
          dataMap[dictType] = [];
        }
      })
    );

    setDictDataMap(dataMap);
  };

  // 获取用户列表
  const { data: userData } = useQuery({
    queryKey: ['users-for-form'],
    queryFn: () => userApi.list({ page: 1, pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // 获取部门树
  const { data: deptData } = useQuery({
    queryKey: ['depts-for-form'],
    queryFn: () => deptApi.treeSelect(),
    staleTime: 5 * 60 * 1000,
  });

  // 转换部门树数据为 TreeSelect 格式
  const transformDeptTree = (depts: any[]): any[] => {
    return depts.map((dept) => ({
      value: dept.id,
      title: dept.name,
      children: dept.children ? transformDeptTree(dept.children) : undefined,
    }));
  };

  // 渲染 ProForm 表单字段
  const renderProFormField = (field: FormField) => {
    const commonProps = {
      name: field.fieldName,
      label: field.fieldLabel,
      rules: field.required
        ? [{ required: true, message: `请填写${field.fieldLabel}` }]
        : [],
      placeholder: field.placeholder ||
        (['select', 'date', 'datetime', 'time', 'user', 'dept'].includes(field.fieldType)
          ? `请选择${field.fieldLabel}`
          : `请输入${field.fieldLabel}`),
    };

    switch (field.fieldType) {
      case 'text':
        return <ProFormText key={field.fieldName} {...commonProps} />;
      case 'textarea':
        return (
          <ProFormTextArea
            key={field.fieldName}
            {...commonProps}
            fieldProps={{ rows: 4 }}
          />
        );
      case 'number':
        return (
          <ProFormDigit
            key={field.fieldName}
            {...commonProps}
            fieldProps={{ style: { width: '100%' } }}
          />
        );
      case 'date':
        return (
          <ProFormDatePicker
            key={field.fieldName}
            {...commonProps}
            fieldProps={{ style: { width: '100%' } }}
          />
        );
      case 'datetime':
        return (
          <ProFormDateTimePicker
            key={field.fieldName}
            {...commonProps}
            fieldProps={{ style: { width: '100%' } }}
          />
        );
      case 'time':
        return (
          <ProFormTimePicker
            key={field.fieldName}
            {...commonProps}
            fieldProps={{ style: { width: '100%' } }}
          />
        );
      case 'select': {
        // 根据选项来源获取选项数据
        let selectOptions: { label: string; value: string }[] = [];
        if (field.optionsSource === 'dict' && field.dictType) {
          selectOptions = dictDataMap[field.dictType] || [];
        } else if (field.options) {
          selectOptions = field.options.map((opt) => ({
            label: opt.label,
            value: opt.value,
          }));
        }
        return (
          <ProFormSelect
            key={field.fieldName}
            {...commonProps}
            options={selectOptions}
            fieldProps={{
              mode: field.multiple ? 'multiple' : undefined,
            }}
          />
        );
      }
      case 'user':
        return (
          <ProFormSelect
            key={field.fieldName}
            {...commonProps}
            options={userData?.data?.map((user) => ({
              label: user.nickname || user.username,
              value: user.id,
            })) || []}
            fieldProps={{
              mode: field.multiple ? 'multiple' : undefined,
              showSearch: true,
              optionFilterProp: 'label',
            }}
          />
        );
      case 'dept':
        return (
          <ProFormTreeSelect
            key={field.fieldName}
            {...commonProps}
            fieldProps={{
              treeData: deptData ? transformDeptTree(deptData) : [],
              treeDefaultExpandAll: true,
              multiple: field.multiple,
              showSearch: true,
              treeNodeFilterProp: 'title',
            }}
          />
        );
      default:
        return <ProFormText key={field.fieldName} {...commonProps} />;
    }
  };

  // 渲染提交成功
  const renderSuccess = () => {
    return (
      <Result
        status="success"
        title="流程发起成功"
        subTitle={`流程编号: ${submittedInstance?.instanceNo || '-'}`}
        extra={[
          <Button
            key="view"
            type="primary"
            onClick={() =>
              navigate(
                `/workflow/instance/detail/${submittedInstance?.instanceId || submittedInstance?.id}`,
              )
            }
          >
            查看流程详情
          </Button>,
          <Button key="list" onClick={() => navigate('/workflow/instance')}>
            返回列表
          </Button>,
          <Button
            key="new"
            onClick={() => {
              setSubmitted(false);
              setSelectedFlow(null);
              setFormFields([]);
            }}
          >
            继续发起
          </Button>,
        ]}
      />
    );
  };

  if (submitted) {
    return (
      <PageContainer title="发起流程">
        <ProCard>{renderSuccess()}</ProCard>
      </PageContainer>
    );
  }

  const flows = flowList?.list || [];
  const categoryOptions =
    categoryData?.list?.map((cat: any) => ({
      label: cat.name,
      value: cat.id,
    })) || [];

  return (
    <PageContainer
      title="发起流程"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      }
    >
      <ProCard>
        <StepsForm
          formRef={formRef}
          onFinish={async (values) => {
            if (!selectedFlow) {
              message.warning('请选择流程');
              return false;
            }
            const { title, remark, ...formData } = values;
            startMutation.mutate({
              flowDefinitionId: selectedFlow.id,
              title,
              remark,
              formData,
            });
            return true;
          }}
          formProps={{
            validateMessages: {
              required: '${label}是必填项',
            },
          }}
          submitter={{
            render: (props) => {
              if (props.step === 0) {
                return (
                  <Button
                    type="primary"
                    onClick={() => props.onSubmit?.()}
                    disabled={!selectedFlow}
                    loading={loadingDetail}
                  >
                    下一步
                  </Button>
                );
              }
              return [
                <Button key="pre" onClick={() => props.onPre?.()}>
                  上一步
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => props.onSubmit?.()}
                  loading={startMutation.isPending}
                >
                  提交申请
                </Button>,
              ];
            },
          }}
        >
          <StepsForm.StepForm
            name="select"
            title="选择流程"
            style={{ minWidth: 900 }}
            onFinish={async () => {
              if (!selectedFlow) {
                message.warning('请选择一个流程');
                return false;
              }
              const success = await loadFlowDetail(selectedFlow.id);
              if (success) {
                // 进入第二步时设置流程标题
                const title = generateFlowTitle(
                  selectedFlow.name,
                  userInfo?.nickname || userInfo?.username || '用户',
                );
                setTimeout(() => {
                  formRef.current?.setFieldsValue({ title });
                }, 0);
              }
              return success;
            }}
          >
            <ProFormSelect
              name="categoryFilter"
              label="按分类筛选"
              allowClear
              placeholder="全部分类"
              options={categoryOptions}
              fieldProps={{
                style: { width: 200 },
                onChange: (value: number | undefined) => {
                  setSelectedCategory(value);
                  // 切换分类时清除已选流程，避免选中不在列表中的流程
                  setSelectedFlow(null);
                },
              }}
            />

            <div style={{ minHeight: 200 }}>
              {flowLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : flows.length === 0 ? (
                <Empty description="暂无可用的流程定义" style={{ padding: 40 }} />
              ) : (
                <CheckCard.Group
                  onChange={(value) => {
                    const flow = flows.find(
                      (f: FlowDefinitionItem) => f.id === value,
                    );
                    setSelectedFlow(flow || null);
                  }}
                  value={selectedFlow?.id}
                  style={{ width: '100%' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {flows.map((flow: FlowDefinitionItem) => (
                      <CheckCard
                        key={flow.id}
                        value={flow.id}
                        title={
                          <Space>
                            <span>{flow.name}</span>
                            <Tag>v{flow.version}</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            {flow.category && (
                              <Tag
                                color={flow.category.color || 'blue'}
                                style={{ marginBottom: 8 }}
                              >
                                {flow.category.name}
                              </Tag>
                            )}
                            <div>
                              <Text type="secondary" style={{ maxWidth: 200 }}>
                                {flow.description || '暂无描述'}
                              </Text>
                            </div>
                          </div>
                        }
                        style={{ width: 280 }}
                      />
                    ))}
                  </div>
                </CheckCard.Group>
              )}
            </div>
          </StepsForm.StepForm>

          <StepsForm.StepForm
            name="form"
            title="填写信息"
            onFinish={async () => {
              // 表单验证会自动进行
              return true;
            }}
          >
            <ProCard
              title={`已选择流程：${selectedFlow?.name || ''}`}
              headerBordered
              style={{ marginBottom: 16 }}
            >
              <ProForm.Group>
                <ProFormText
                  name="title"
                  label="流程标题"
                  width="lg"
                  rules={[{ required: true, message: '请输入流程标题' }]}
                  placeholder="请输入流程标题"
                />
              </ProForm.Group>

              {formFields.map((field) => renderProFormField(field))}

              <ProFormTextArea
                name="remark"
                label="备注"
                placeholder="请输入备注信息（可选）"
                fieldProps={{ rows: 3 }}
              />
            </ProCard>
          </StepsForm.StepForm>
        </StepsForm>
      </ProCard>
    </PageContainer>
  );
};

export default StartFlow;
