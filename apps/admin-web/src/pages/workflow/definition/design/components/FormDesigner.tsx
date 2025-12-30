import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ProCard,
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
  ProFormRadio,
  ModalForm,
} from '@ant-design/pro-components';
import { Button, Space, Popconfirm, message, Table, Tag, Tooltip } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  EditOutlined,
  SettingOutlined,
  CopyOutlined,
  FormatPainterOutlined,
} from '@ant-design/icons';
import { dictApi } from '@/services/system/system';
import { generateKeyFromName } from '@/utils/name-key';
import type { FormField } from '../types';

interface FormDesignerProps {
  formFields: FormField[];
  onChange: (fields: FormField[]) => void;
  readOnly?: boolean;
}

// 字段类型选项
const fieldTypeOptions = [
  { label: '单行文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '日期时间', value: 'datetime' },
  { label: '时间', value: 'time' },
  { label: '下拉选择', value: 'select' },
  { label: '用户选择', value: 'user' },
  { label: '部门选择', value: 'dept' },
];

// 字段类型标签颜色
const fieldTypeColors: Record<string, string> = {
  text: 'blue',
  textarea: 'cyan',
  number: 'green',
  date: 'orange',
  datetime: 'orange',
  time: 'orange',
  select: 'purple',
  user: 'magenta',
  dept: 'gold',
};

const FormDesigner: React.FC<FormDesignerProps> = ({
  formFields,
  onChange,
  readOnly = false,
}) => {
  const [form] = ProForm.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [optionsSource, setOptionsSource] = useState<'manual' | 'dict'>('manual');

  // 获取字典类型列表
  const { data: dictTypes } = useQuery({
    queryKey: ['dict-types-for-form'],
    queryFn: async () => {
      const res = await dictApi.listType({ page: 1, pageSize: 100, status: 'ENABLED' });
      return res.data?.map((item) => ({
        label: `${item.name} (${item.type})`,
        value: item.type,
      })) || [];
    },
  });

  // 添加字段
  const handleAdd = () => {
    const values = form.getFieldsValue();
    if (!values.fieldLabel) {
      message.warning('请填写字段标签');
      return;
    }

    const fieldName = values.fieldName || `field_${Date.now()}`;

    // 检查字段名是否重复
    if (formFields.some(f => f.fieldName === fieldName)) {
      message.warning('字段名已存在');
      return;
    }

    const newField: FormField = {
      fieldName,
      fieldLabel: values.fieldLabel,
      fieldType: values.fieldType || 'text',
      required: values.required || false,
      multiple: values.multiple || false,
    };

    onChange([...formFields, newField]);
    form.resetFields();
    message.success('添加成功');
  };

  // 删除字段
  const handleDelete = (index: number) => {
    const newFields = formFields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  // 移动字段
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formFields.length - 1)
    ) {
      return;
    }

    const newFields = [...formFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  // 打开编辑弹窗
  const handleEdit = (index: number) => {
    const field = formFields[index];
    setEditingIndex(index);
    setEditingField({ ...field });
    setOptionsSource(field.optionsSource || 'manual');
    setEditModalOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async (values: any) => {
    if (editingIndex === null) return false;

    const newFields = [...formFields];
    newFields[editingIndex] = {
      ...newFields[editingIndex],
      fieldLabel: values.fieldLabel,
      fieldType: values.fieldType,
      required: values.required || false,
      placeholder: values.placeholder,
      multiple: values.multiple || false,
      // 根据选项来源保存不同的数据
      optionsSource: values.optionsSource,
      dictType: values.optionsSource === 'dict' ? values.dictType : undefined,
      options: values.optionsSource === 'manual' && values.options ? parseOptions(values.options) : undefined,
    };
    onChange(newFields);
    setEditModalOpen(false);
    setEditingIndex(null);
    setEditingField(null);
    setOptionsSource('manual');
    message.success('保存成功');
    return true;
  };

  // 解析选项字符串为数组
  const parseOptions = (optionsStr: string): { label: string; value: string }[] => {
    if (!optionsStr) return [];
    return optionsStr.split('\n').filter(line => line.trim()).map(line => {
      const [value, label] = line.split(':').map(s => s.trim());
      return { label: label || value, value };
    });
  };

  // 将选项数组转为字符串
  const formatOptions = (options?: { label: string; value: string }[]): string => {
    if (!options || options.length === 0) return '';
    return options.map(opt => `${opt.value}:${opt.label}`).join('\n');
  };

  // 判断是否需要配置选项
  const needsOptions = (fieldType: string) => fieldType === 'select';

  // 判断是否支持多选
  const supportsMultiple = (fieldType: string) => ['select', 'user', 'dept'].includes(fieldType);

  const columns = [
    {
      title: '字段名',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 140,
      render: (text: string) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    {
      title: '字段标签',
      dataIndex: 'fieldLabel',
      key: 'fieldLabel',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'fieldType',
      key: 'fieldType',
      width: 100,
      render: (type: string) => {
        const option = fieldTypeOptions.find((o) => o.value === type);
        return (
          <Tag color={fieldTypeColors[type] || 'default'}>
            {option?.label || type}
          </Tag>
        );
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      width: 60,
      render: (required: boolean) => (
        <Tag color={required ? 'red' : 'default'}>{required ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '多选',
      dataIndex: 'multiple',
      key: 'multiple',
      width: 60,
      render: (multiple: boolean, record: FormField) => {
        if (!supportsMultiple(record.fieldType)) return '-';
        return <Tag color={multiple ? 'blue' : 'default'}>{multiple ? '是' : '否'}</Tag>;
      },
    },
    {
      title: '选项',
      dataIndex: 'options',
      key: 'options',
      width: 120,
      render: (_: unknown, record: FormField) => {
        if (!needsOptions(record.fieldType)) return '-';
        // 字典类型
        if (record.optionsSource === 'dict' && record.dictType) {
          return (
            <Tooltip title={`使用字典: ${record.dictType}`}>
              <Tag color="blue">字典: {record.dictType}</Tag>
            </Tooltip>
          );
        }
        // 手动配置
        if (record.options && record.options.length > 0) {
          return (
            <Tooltip title={record.options.map(o => `${o.label}(${o.value})`).join(', ')}>
              <Tag color="success">{record.options.length} 个选项</Tag>
            </Tooltip>
          );
        }
        return <Tag color="warning">未配置</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: FormField, index: number) => (
        <Space size="small">
          {!readOnly && (
            <>
              <Tooltip title="编辑">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(index)}
                />
              </Tooltip>
              <Tooltip title="上移">
                <Button
                  type="link"
                  size="small"
                  icon={<UpOutlined />}
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                />
              </Tooltip>
              <Tooltip title="下移">
                <Button
                  type="link"
                  size="small"
                  icon={<DownOutlined />}
                  disabled={index === formFields.length - 1}
                  onClick={() => handleMove(index, 'down')}
                />
              </Tooltip>
              <Popconfirm
                title="确定删除此字段？"
                onConfirm={() => handleDelete(index)}
              >
                <Tooltip title="删除">
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ProCard
      title="表单设计"
      headerBordered
      extra={
        <Space>
          <Tag color="blue">{formFields.length} 个字段</Tag>
        </Space>
      }
    >
      <Table
        dataSource={formFields}
        columns={columns}
        rowKey="fieldName"
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无表单字段，请在下方添加' }}
      />

      {!readOnly && (
        <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 6 }}>
          <ProForm
            form={form}
            layout="inline"
            size="small"
            submitter={false}
          >
            <ProFormText
              name="fieldName"
              label="字段名"
              placeholder="自动生成"
              tooltip="留空则自动生成"
              fieldProps={{ style: { width: 120 } }}
            />
            <ProFormText
              name="fieldLabel"
              label="标签"
              rules={[{ required: true }]}
              placeholder="如：请假天数"
              fieldProps={{
                style: { width: 120 },
                onChange: (e) => {
                  const value = e.target.value;
                  if (value) {
                    // 自动生成字段名（大写），并添加行号后缀避免重复
                    const baseFieldName = generateKeyFromName(value);
                    let fieldName = baseFieldName;
                    let suffix = 1;

                    // 检查是否与现有字段名重复，如果重复则添加后缀
                    while (formFields.some(f => f.fieldName === fieldName)) {
                      suffix++;
                      fieldName = `${baseFieldName}_${suffix}`;
                    }

                    form.setFieldValue('fieldName', fieldName);
                  }
                },
              }}
            />
            <ProFormSelect
              name="fieldType"
              label="类型"
              initialValue="text"
              options={fieldTypeOptions}
              fieldProps={{ style: { width: 110 } }}
            />
            <ProFormSwitch
              name="required"
              label="必填"
            />
            <ProFormSwitch
              name="multiple"
              label="多选"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加
            </Button>
          </ProForm>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            提示：下拉选择类型需要在编辑中配置选项；用户选择和部门选择会自动从系统获取数据
          </div>
        </div>
      )}

      {/* 编辑字段弹窗 */}
      <ModalForm
        title={
          <Space>
            <SettingOutlined />
            <span>编辑字段 - {editingField?.fieldLabel}</span>
          </Space>
        }
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        width={500}
        initialValues={editingField ? {
          ...editingField,
          optionsSource: editingField.optionsSource || 'manual',
          options: formatOptions(editingField.options),
        } : undefined}
        modalProps={{ destroyOnClose: true }}
        onFinish={handleSaveEdit}
      >
        <ProFormText
          name="fieldName"
          label="字段名"
          disabled
          tooltip="字段名不可修改"
        />
        <ProFormText
          name="fieldLabel"
          label="字段标签"
          rules={[{ required: true, message: '请输入字段标签' }]}
          placeholder="请输入字段标签"
        />
        <ProFormSelect
          name="fieldType"
          label="字段类型"
          rules={[{ required: true, message: '请选择字段类型' }]}
          options={fieldTypeOptions}
        />
        <ProFormText
          name="placeholder"
          label="占位提示"
          placeholder="如：请输入..."
        />
        <ProFormSwitch
          name="required"
          label="是否必填"
        />
        <ProForm.Item noStyle shouldUpdate>
          {(formInstance) => {
            const fieldType = formInstance.getFieldValue('fieldType');
            if (!supportsMultiple(fieldType)) return null;
            return (
              <ProFormSwitch
                name="multiple"
                label="是否多选"
                tooltip={
                  fieldType === 'select'
                    ? '启用后可选择多个选项'
                    : fieldType === 'user'
                    ? '启用后可选择多个用户'
                    : '启用后可选择多个部门'
                }
              />
            );
          }}
        </ProForm.Item>
        <ProForm.Item noStyle shouldUpdate>
          {(formInstance) => {
            const fieldType = formInstance.getFieldValue('fieldType');
            if (!needsOptions(fieldType)) return null;
            return (
              <ProFormRadio.Group
                name="optionsSource"
                label="选项来源"
                initialValue={optionsSource}
                options={[
                  { label: '手动配置', value: 'manual' },
                  { label: '使用字典', value: 'dict' },
                ]}
                fieldProps={{
                  onChange: (e) => setOptionsSource(e.target.value),
                }}
              />
            );
          }}
        </ProForm.Item>
        <ProForm.Item noStyle shouldUpdate>
          {(formInstance) => {
            const fieldType = formInstance.getFieldValue('fieldType');
            const source = formInstance.getFieldValue('optionsSource') || optionsSource;
            if (!needsOptions(fieldType) || source !== 'dict') return null;
            return (
              <ProFormSelect
                name="dictType"
                label="选择字典"
                placeholder="请选择字典类型"
                options={dictTypes}
                showSearch
                rules={[
                  {
                    required: true,
                    message: '请选择字典类型',
                  },
                ]}
              />
            );
          }}
        </ProForm.Item>
        <ProForm.Item noStyle shouldUpdate>
          {(formInstance) => {
            const fieldType = formInstance.getFieldValue('fieldType');
            const source = formInstance.getFieldValue('optionsSource') || optionsSource;
            if (!needsOptions(fieldType) || source !== 'manual') return null;

            // 复制示例数据
            const handleCopyExample = () => {
              const exampleData = `1:选项一
2:选项二
3:选项三`;
              navigator.clipboard.writeText(exampleData).then(() => {
                message.success('已复制示例数据到剪贴板，可直接粘贴使用');
              }).catch(() => {
                message.error('复制失败，请手动复制');
              });
            };

            // 格式化文本框内容
            const handleFormat = () => {
              const optionsValue = formInstance.getFieldValue('options');
              if (optionsValue && optionsValue.trim()) {
                const formattedOptions = optionsValue
                  .split('\n')
                  .filter((line: string) => line.trim())
                  .map((line: string) => line.trim())
                  .join('\n');

                formInstance.setFieldValue('options', formattedOptions);
                const lineCount = formattedOptions.split('\n').length;
                message.success(`已格式化，共 ${lineCount} 个选项`);
              } else {
                message.warning('没有可格式化的内容');
              }
            };

            return (
              <ProFormTextArea
                name="options"
                label={
                  <Space>
                    <span>选项配置</span>
                    <Tooltip title="复制示例数据">
                      <Button
                        type="link"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={handleCopyExample}
                        style={{ padding: 0, height: 'auto' }}
                      />
                    </Tooltip>
                    <Tooltip title="格式化">
                      <Button
                        type="link"
                        size="small"
                        icon={<FormatPainterOutlined />}
                        onClick={handleFormat}
                        style={{ padding: 0, height: 'auto' }}
                      />
                    </Tooltip>
                  </Space>
                }
                placeholder={`每行一个选项，格式：值:标签\n例如：\n1:选项一\n2:选项二\n3:选项三`}
                tooltip="每行一个选项，格式为 值:标签，如果只写值则标签和值相同"
                fieldProps={{ rows: 6 }}
                rules={[
                  {
                    required: true,
                    message: '下拉选择类型必须配置选项',
                  },
                ]}
              />
            );
          }}
        </ProForm.Item>
      </ModalForm>
    </ProCard>
  );
};

export default FormDesigner;
