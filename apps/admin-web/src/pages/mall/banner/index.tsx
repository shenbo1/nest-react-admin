import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Image, Switch } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormDateRangePicker,
  ProFormGroup,
} from '@ant-design/pro-components';
import { DictRadio, DictSelect } from '@/components/DictSelect';
import { useForm } from 'antd/es/form/Form';
import { useMutation } from '@tanstack/react-query';
import { bannerApi, Banner, BannerForm } from '@/services/mall/banner';
import { PermissionButton } from '@/components/PermissionButton';
import { ImageUpload } from '@/components/ImageUpload';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { generateKeyFromName } from '@/utils/name-key';
import { DictEnums } from '@/stores/enums/dict.enums';
import { BannerTypeEnums, StatusEnums } from '@/stores/enums/common.enums';

export default function BannerPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Banner | null>(null);
  const [form] = useForm();
  const [resetImageUpload, setResetImageUpload] = useState(false);

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: BannerForm) => {
      // 处理RangePicker的数据
      const processedData = { ...data };
      if (editingRecord) {
        return bannerApi.update(editingRecord.id, processedData);
      }
      return bannerApi.create(processedData);
    },
    onSuccess: () => {
      message.success(editingRecord ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingRecord(null);
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '操作失败');
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: bannerApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '删除失败');
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: bannerApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      actionRef.current?.reload();
    },
  });

  const handleToggleStatus = (record: Banner) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '禁用' : '启用'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEdit = (record: Banner) => {
    setEditingRecord(record);

    // 直接设置表单值，ProFormDateRangePicker 会自动将 startTime 和 endTime 转换为日期对象
    form.setFieldsValue(record);

    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields(); // 新增时重置表单

    // 重置图片上传组件
    setResetImageUpload(true);

    // 设置默认值
    form.setFieldsValue({
      sort: 0,
      status: 'ENABLED',
      type: 1,
    });

    // 重置重置信号，以便下次能再次触发
    setTimeout(() => {
      setResetImageUpload(false);
    }, 0);

    setModalOpen(true);
  };

  const columns: ProColumns<Banner>[] = [
    {
      title: '轮播图信息',
      dataIndex: 'name',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              width: 80,
              height: 60,
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {record.type === 1 && record.image ? (
              <Image
                src={record.image}
                alt={record.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setPreviewImage(record.image!);
                  setPreviewVisible(true);
                }}
              />
            ) : record.type === 1 ? (
              <PictureOutlined
                style={{
                  fontSize: 24,
                  color: '#999',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              />
            ) : (
              <VideoCameraOutlined
                style={{
                  fontSize: 24,
                  color: '#999',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.code && `编码: ${record.code}`}
            </div>
            {record.position && (
              <Tag color="blue" style={{ marginTop: 4 }}>
                {record.position}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      align: 'center',
      render: (type) => (
        <Tag color={type === 1 ? 'green' : 'orange'}>
          {type === 1 ? '图片' : '视频'}
        </Tag>
      ),
      search: false,
    },
    {
      title: '跳转链接',
      dataIndex: 'linkUrl',
      width: 200,
      ellipsis: true,
      render: (text) => text || '-',
      search: false,
    },
    {
      title: '有效期',
      dataIndex: 'validity',
      width: 220,
      search: false,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>
            开始:{' '}
            {record.startTime
              ? new Date(record.startTime).toLocaleDateString()
              : '-'}
          </div>
          <div>
            结束:{' '}
            {record.endTime
              ? new Date(record.endTime).toLocaleDateString()
              : '-'}
          </div>
        </div>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      align: 'center',
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '禁用', status: 'Error' },
      },
      render: (_, record: Banner) => (
        <Switch
          key={record.id}
          size="small"
          checked={record.status === 'ENABLED'}
          checkedChildren="正常"
          unCheckedChildren="停用"
          onClick={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={MALL.BANNER.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MALL.BANNER.REMOVE}
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </PermissionButton>
        </Space>
      ),
    },
  ];

  // 预览图片URL
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);

  return (
    <>
      {/* 图片预览模态框 */}
      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={600}
      >
        <img alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>

      <ProTable<Banner>
        headerTitle="轮播图管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        api="/mall/banner"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MALL.BANNER.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<BannerForm>
        title={editingRecord ? '编辑轮播图' : '新增轮播图'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        form={form}
        initialValues={
          editingRecord || {
            sort: 0,
            status: 'ENABLED',
            type: 1,
          }
        }
        onFinish={async (values) => {
          // 处理日期格式，将 Date 对象转换为 ISO 字符串
          const processFormValues: any = { ...values };
          if (processFormValues.time && processFormValues.time.length > 0) {
            const [startTime, endTime] = processFormValues.time;
            processFormValues.startTime = new Date(
              `${startTime} 00:00:00`,
            ).toISOString();
            processFormValues.endTime = new Date(
              `${endTime} 23:59:59`,
            ).toISOString();
          }
          await saveMutation.mutateAsync(processFormValues as BannerForm);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 600,
        }}
      >
        <ProFormGroup title="基本信息">
          <ProFormText
            name="name"
            label="名称"
            placeholder="请输入名称"
            rules={[{ required: true, message: '请输入名称' }]}
            fieldProps={{
              onChange: (e) => {
                // 自动生成编码
                const value = e.target.value;
                if (value && !editingRecord) {
                  form.setFieldValue('code', generateKeyFromName(value));
                }
              },
            }}
          />
          <ProFormText name="code" label="编码" placeholder="请输入编码" />
          <ProFormDigit
            name="sort"
            label="排序"
            placeholder="请输入排序号"
            min={0}
            fieldProps={{ precision: 0 }}
          />
          <DictRadio name="type" label="类型" enum={BannerTypeEnums} />
          <DictRadio name="status" label="状态" enum={StatusEnums} />
        </ProFormGroup>

        <ProFormGroup title="图片信息">
          <ProFormText
            name="image"
            label="图片"
            rules={[{ required: true, message: '请上传图片' }]}
            fieldProps={{
              style: { display: 'none' },
            }}
          />
          <ImageUpload reset={resetImageUpload} />
          <ProFormText
            name="linkUrl"
            label="跳转链接"
            placeholder="请输入跳转链接"
          />
        </ProFormGroup>

        <ProFormGroup title="其他信息">
          <DictSelect
            name="position"
            label="展示位置"
            placeholder="请选择展示位置"
            dictType={DictEnums.商城Banner展示位}
          />

          <ProFormDateRangePicker
            name={'time'}
            label="有效期"
            fieldProps={{
              showTime: false,
            }}
          />
          <ProFormTextArea
            name="content"
            label="内容"
            placeholder="请输入内容"
          />
          <ProFormTextArea
            name="remark"
            label="备注"
            placeholder="请输入备注"
          />
        </ProFormGroup>
      </ModalForm>
    </>
  );
}
