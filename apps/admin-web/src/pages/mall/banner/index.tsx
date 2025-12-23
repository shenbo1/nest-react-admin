import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Image } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormDateRangePicker,
  ProFormGroup,
} from '@ant-design/pro-components';
import { useForm } from 'antd/es/form/Form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { dictApi } from '@/services/system/system';
import { bannerApi, Banner, BannerForm } from '@/services/mall/banner';
import { PermissionButton } from '@/components/PermissionButton';
import { ImageUpload } from '@/components/ImageUpload';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function BannerPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Banner | null>(null);
  const [form] = useForm();

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
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<Banner>[] = [
    {
      title: '轮播图信息',
      dataIndex: 'name',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 80, height: 60, border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden' }}>
            {record.type === 1 && record.image ? (
              <Image
                src={record.image}
                alt={record.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => {
                  setPreviewImage(record.image!);
                  setPreviewVisible(true);
                }}
              />
            ) : record.type === 1 ? (
              <PictureOutlined style={{ fontSize: 24, color: '#999', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }} />
            ) : (
              <VideoCameraOutlined style={{ fontSize: 24, color: '#999', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{record.name}</div>
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
          <div>开始: {record.startTime ? new Date(record.startTime).toLocaleDateString() : '-'}</div>
          <div>结束: {record.endTime ? new Date(record.endTime).toLocaleDateString() : '-'}</div>
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

  // 获取轮播图位置字典
  const { data: positionData, isLoading: positionsLoading } = useQuery({
    queryKey: ['banner_positions'],
    queryFn: () => dictApi.getDataByType('banner_position'),
  });
  const positionOptions = Array.isArray(positionData) ? positionData : [];

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
        initialValues={editingRecord || {
          sort: 0,
          status: 'ENABLED',
          type: 1
        }}
        onFinish={async (values) => {
          // 处理日期格式，dayjs 对象转换为 ISO 字符串
          const formatDate = (date: any) => {
            if (!date) return undefined;
            if (typeof date === 'string') return date;
            if (typeof date.toISOString === 'function') return date.toISOString();
            return undefined;
          };
          await saveMutation.mutateAsync({
            ...values,
            startTime: formatDate(values.startTime),
            endTime: formatDate(values.endTime),
          });
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
              onBlur: (e) => {
                // 自动生成编码
                const name = e.target.value;
                if (name && !editingRecord) {
                  // 生成简化的编码
                  const code = name
                    .toLowerCase()
                    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
                    .substring(0, 50);
                  form.setFieldValue('code', code);
                }
              },
            }}
          />
          <ProFormText
            name="code"
            label="编码"
            placeholder="请输入编码"
          />
          <ProFormDigit
            name="sort"
            label="排序"
            placeholder="请输入排序号"
            min={0}
            fieldProps={{ precision: 0 }}
          />
          <ProFormSelect
            name="type"
            label="类型"
            options={[
              { label: '图片', value: 1 },
              { label: '视频', value: 2 },
            ]}
          />
          <ProFormSelect
            name="status"
            label="状态"
            options={[
              { label: '启用', value: 'ENABLED' },
              { label: '禁用', value: 'DISABLED' },
            ]}
          />
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
          <ImageUpload />
          <ProFormText
            name="linkUrl"
            label="跳转链接"
            placeholder="请输入跳转链接"
          />
        </ProFormGroup>

        <ProFormGroup title="其他信息">
          <ProFormSelect
            name="position"
            label="展示位置"
            placeholder="请选择展示位置"
            disabled={positionsLoading}
            options={positionOptions.map((item: any) => ({
              label: item.label,
              value: item.value,
            }))}
          />
          <ProFormDateRangePicker
            name={['startTime', 'endTime']}
            label="有效期"
            fieldProps={{
              showTime: true,
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
