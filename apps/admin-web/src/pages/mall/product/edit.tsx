import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  message,
  Space,
  Tag,
  Table,
  Button,
  Input,
  Popconfirm,
  Empty,
  Card,
  Upload,
  Form,
  InputNumber,
  Select,
  Modal,
  TreeSelect,
  Row,
  Col,
  Spin,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
import {
  StepsForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
  ProFormDependency,
  PageContainer,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  productApi,
  ProductForm,
  ProductStatus,
  ProductSpecGroup,
  ProductSku,
  getProductSpecGroups,
  createProductSpecGroup,
  updateProductSpecGroup,
  deleteProductSpecGroup,
  createProductSpecValue,
  deleteProductSpecValue,
  bulkCreateProductSkus,
  updateProductSku,
  deleteProductSku,
  bulkDeleteProductSkus,
} from '@/services/mall/product';
import { categoryApi, CategoryTree } from '@/services/mall/category';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import { uploadImage } from '@/services/upload';
import pinyin from 'pinyin';

// 辅助函数：将 Prisma Decimal 转换为数字
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  return Number(value) || 0;
};

// 生成商品编码：根据名称生成拼音首字母 + 时间戳后4位
const generateProductCode = (name: string): string => {
  if (!name) return '';
  try {
    const pinyinResult = pinyin(name, {
      style: pinyin.STYLE_FIRST_LETTER,
    });
    const letters = pinyinResult
      .map((p: string[]) => p[0]?.toUpperCase() || '')
      .join('');
    const timestamp = Date.now().toString().slice(-4);
    return `${letters}${timestamp}`;
  } catch {
    return `SP${Date.now().toString().slice(-6)}`;
  }
};

// 根据规格组合生成 SKU 编码
// 例如：颜色:红色, 尺码:S -> SKU-YSHS-CMS-1234
// 如果有前缀：SKU-PRODUCT001-YSHS-CMS-1234
// 末尾添加时间戳后4位确保唯一性
const generateSkuCode = (
  specCombination: Record<string, string>,
  prefix?: string,
  timestamp?: number
): string => {
  try {
    const parts: string[] = [];
    Object.entries(specCombination).forEach(([key, value]) => {
      // 获取规格名的拼音首字母
      const keyPinyin = pinyin(key, { style: pinyin.STYLE_FIRST_LETTER });
      const keyLetters = keyPinyin.map((p: string[]) => p[0]?.toUpperCase() || '').join('');
      // 获取规格值的拼音首字母
      const valuePinyin = pinyin(value, { style: pinyin.STYLE_FIRST_LETTER });
      const valueLetters = valuePinyin.map((p: string[]) => p[0]?.toUpperCase() || '').join('');
      parts.push(`${keyLetters}${valueLetters}`);
    });
    const specCode = parts.join('-');
    // 添加时间戳后4位确保唯一性
    const suffix = (timestamp || Date.now()).toString().slice(-4);
    // 始终添加 SKU- 前缀
    return prefix ? `SKU-${prefix}-${specCode}-${suffix}` : `SKU-${specCode}-${suffix}`;
  } catch {
    // 降级方案：使用时间戳
    return `SKU-${Date.now()}`;
  }
};

// 将分类树转换为 TreeSelect 数据格式（只能选择叶子节点）
const transformCategoryTree = (categories?: CategoryTree[]): any[] => {
  if (!categories) return [];
  return categories.map((cat) => {
    const hasChildren = cat.children && cat.children.length > 0;
    return {
      value: cat.id,
      title: cat.name,
      disabled: hasChildren,
      selectable: !hasChildren,
      children: hasChildren ? transformCategoryTree(cat.children) : undefined,
    };
  });
};

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialStep = parseInt(searchParams.get('step') || '0', 10);

  const formRef = useRef<any>(null);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [productId, setProductId] = useState<number | null>(
    id ? parseInt(id, 10) : null,
  );
  const [skuList, setSkuList] = useState<ProductSku[]>([]);
  const [specGroups, setSpecGroups] = useState<ProductSpecGroup[]>([]);

  const isEdit = !!id;

  // 获取分类列表（树形结构）
  const { data: categoryData } = useQuery({
    queryKey: ['categoryTreeSelect'],
    queryFn: () => categoryApi.listForSelect(),
  });

  const categoryTreeData = categoryData?.list
    ? transformCategoryTree(categoryData.list)
    : [];

  // 加载商品详情
  const { data: productDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['productDetail', id],
    queryFn: () => productApi.get(parseInt(id!, 10)),
    enabled: !!id,
  });

  // 加载规格组和SKU
  useEffect(() => {
    if (productDetail) {
      setSkuList(productDetail.skus || []);
      setSpecGroups(productDetail.specGroups || []);
      setProductId(productDetail.id);
    }
  }, [productDetail]);

  // 刷新商品详情
  const refreshProductDetail = async (pid?: number) => {
    const targetId = pid || productId;
    if (!targetId) return;
    const detail = await productApi.get(targetId);
    setSkuList(detail.skus || []);
    setSpecGroups(detail.specGroups || []);
  };

  // 创建/更新商品
  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      if (productId) {
        return productApi.update(productId, data);
      }
      return productApi.create(data);
    },
    onSuccess: async (res) => {
      message.success(productId ? '更新成功' : '创建成功');
      if (!productId && res.id) {
        setProductId(res.id);
        // 更新URL但不刷新页面
        window.history.replaceState(null, '', `/mall/product/edit/${res.id}`);
      }
    },
  });

  const handleGoBack = () => {
    navigate('/mall/product');
  };

  if (detailLoading) {
    return (
      <PageContainer
        header={{
          title: '加载中...',
          onBack: handleGoBack,
        }}
      >
        <Card style={{ borderRadius: 8 }}>
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" tip="正在加载商品信息..." />
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: isEdit ? '编辑商品' : '新增商品',
        onBack: handleGoBack,
        breadcrumb: {},
      }}
      style={{ padding: '0 24px' }}
    >
      <Card
        style={{
          borderRadius: 8,
          boxShadow:
            '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        }}
        styles={{
          body: { padding: '32px 24px' },
        }}
      >
        <StepsForm
          formRef={formRef}
          current={currentStep}
          onCurrentChange={setCurrentStep}
          onFinish={async () => {
            message.success('商品保存完成');
            navigate('/mall/product');
            return true;
          }}
          submitter={{
            render: (props) => {
              return (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 16,
                    marginTop: 48,
                    paddingTop: 24,
                    borderTop: '1px solid #f0f0f0',
                  }}
                >
                  {props.step === 0 ? (
                    <Button
                      key="back"
                      size="large"
                      onClick={handleGoBack}
                      icon={<ArrowLeftOutlined />}
                      style={{ minWidth: 120 }}
                    >
                      返回列表
                    </Button>
                  ) : (
                    <Button
                      key="pre"
                      size="large"
                      onClick={() => props.onPre?.()}
                      style={{ minWidth: 120 }}
                    >
                      上一步
                    </Button>
                  )}

                  {props.step === 2 ? (
                    <Button
                      key="finish"
                      type="primary"
                      size="large"
                      onClick={() => navigate('/mall/product')}
                      icon={<CheckCircleOutlined />}
                      style={{ minWidth: 120 }}
                    >
                      完成
                    </Button>
                  ) : (
                    <Button
                      key="next"
                      type="primary"
                      size="large"
                      onClick={() => props.onSubmit?.()}
                      style={{ minWidth: 120 }}
                    >
                      下一步
                    </Button>
                  )}
                </div>
              );
            },
          }}
          stepsProps={{
            style: {
              marginBottom: 40,
              maxWidth: 600,
              margin: '0 auto 40px',
            },
          }}
        >
          {/* 第一步：基本信息 */}
          <StepsForm.StepForm
            name="basic"
            title="基本信息"
            initialValues={
              productDetail
                ? {
                    ...productDetail,
                    originalPrice: toNumber(productDetail.originalPrice),
                    defaultPrice: toNumber(productDetail.defaultPrice),
                    defaultStock: toNumber(productDetail.defaultStock),
                    defaultWeight: toNumber(productDetail.defaultWeight),
                    sales: toNumber(productDetail.sales),
                  }
                : {
                    sort: 0,
                    status: 'DRAFT' as ProductStatus,
                    defaultStock: 0,
                    sales: 0,
                  }
            }
            onFinish={async (values) => {
              try {
                await saveMutation.mutateAsync(values as ProductForm);
                return true;
              } catch {
                return false;
              }
            }}
          >
            <BasicInfoForm
              formRef={formRef}
              categoryTreeData={categoryTreeData}
              isEdit={isEdit}
            />
          </StepsForm.StepForm>

          {/* 第二步：规格管理 */}
          <StepsForm.StepForm
            name="spec"
            title="规格管理"
            onFinish={async () => {
              if (!productId) {
                message.warning('请先保存商品基本信息');
                return false;
              }
              return true;
            }}
          >
            <SpecGroupStep
              productId={productId}
              specGroups={specGroups}
              onSpecGroupsChange={setSpecGroups}
              onRefreshProductDetail={() => refreshProductDetail()}
            />
          </StepsForm.StepForm>

          {/* 第三步：SKU管理 */}
          <StepsForm.StepForm name="sku" title="SKU管理">
            <SkuManageStep
              productId={productId}
              skuList={skuList}
              specGroups={specGroups}
              onSkuChange={setSkuList}
              onRefreshProductDetail={() => refreshProductDetail()}
            />
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </PageContainer>
  );
}

// 分区标题组件
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          width: 4,
          height: 16,
          background: '#1677ff',
          borderRadius: 2,
          marginRight: 10,
        }}
      />
      <Text strong style={{ fontSize: 15, color: '#333' }}>
        {children}
      </Text>
    </div>
  );
}

// 基本信息表单组件
function BasicInfoForm({
  formRef,
  categoryTreeData,
  isEdit,
}: {
  formRef: any;
  categoryTreeData: any[];
  isEdit: boolean;
}) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* 基本信息 */}
      <SectionTitle>基本信息</SectionTitle>
      <Row gutter={24}>
        <Col span={12}>
          <ProFormText
            name="name"
            label="商品名称"
            placeholder="请输入商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          />
        </Col>
        <Col span={12}>
          <ProFormDependency name={['name']}>
            {({ name }) => (
              <ProFormText
                name="code"
                label="商品编码"
                placeholder="输入名称后自动生成"
                tooltip="根据商品名称自动生成拼音首字母编码，也可手动修改"
                rules={[{ required: true, message: '请输入商品编码' }]}
                fieldProps={{
                  suffix:
                    name && !isEdit ? (
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0 }}
                        onClick={() => {
                          const code = generateProductCode(name);
                          formRef.current?.setFieldValue('code', code);
                        }}
                      >
                        生成编码
                      </Button>
                    ) : null,
                }}
              />
            )}
          </ProFormDependency>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="categoryId"
            label="商品分类"
            rules={[{ required: true, message: '请选择商品分类' }]}
          >
            <TreeSelect
              placeholder="请选择商品分类"
              treeData={categoryTreeData}
              treeDefaultExpandAll
              allowClear
              showSearch
              treeNodeFilterProp="title"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <ProFormDigit
            name="sort"
            label="排序"
            placeholder="排序号"
            min={0}
            fieldProps={{ precision: 0 }}
          />
        </Col>
        {isEdit && (
          <Col span={6}>
            <ProFormSelect
              name="status"
              label="销售状态"
              options={[
                { label: '上架', value: 'ON_SHELF' },
                { label: '下架', value: 'OFF_SHELF' },
                { label: '草稿', value: 'DRAFT' },
              ]}
            />
          </Col>
        )}
      </Row>

      {/* 价格库存 */}
      <div style={{ marginTop: 32 }} />
      <SectionTitle>价格库存</SectionTitle>
      <Row gutter={24}>
        <Col span={8}>
          <ProFormDigit
            name="originalPrice"
            label="原价"
            placeholder="请输入原价"
            min={0}
            rules={[{ required: true, message: '请输入原价' }]}
            fieldProps={{ precision: 2, prefix: '¥' }}
          />
        </Col>
        <Col span={8}>
          <ProFormDigit
            name="defaultPrice"
            label="现价"
            placeholder="请输入现价"
            min={0}
            rules={[{ required: true, message: '请输入现价' }]}
            fieldProps={{ precision: 2, prefix: '¥' }}
          />
        </Col>
        <Col span={8}>
          <ProFormDigit
            name="defaultStock"
            label="库存"
            placeholder="请输入库存"
            min={0}
            rules={[{ required: true, message: '请输入库存' }]}
            fieldProps={{ precision: 0 }}
          />
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={8}>
          <ProFormDigit
            name="defaultWeight"
            label="重量(kg)"
            placeholder="请输入重量"
            min={0}
            rules={[{ required: true, message: '请输入重量' }]}
            fieldProps={{ precision: 2 }}
          />
        </Col>
        <Col span={8}>
          <ProFormText
            name="unit"
            label="单位"
            placeholder="如：件、个、箱"
            rules={[{ required: true, message: '请输入单位' }]}
          />
        </Col>
        <Col span={8}>
          <ProFormDigit
            name="sales"
            label="销量"
            placeholder="请输入销量"
            min={0}
            rules={[{ required: true, message: '请输入销量' }]}
            fieldProps={{ precision: 0 }}
          />
        </Col>
      </Row>

      {/* 商品描述 */}
      <div style={{ marginTop: 32 }} />
      <SectionTitle>商品描述</SectionTitle>
      <Row gutter={24}>
        <Col span={24}>
          <ProFormTextArea
            name="content"
            label="商品详情"
            placeholder="请输入商品详情描述"
            fieldProps={{ autoSize: { minRows: 3, maxRows: 6 } }}
          />
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={24}>
          <ProFormTextArea
            name="remark"
            label="备注"
            placeholder="请输入备注信息"
            fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
          />
        </Col>
      </Row>

      {/* 商品图片 */}
      <div style={{ marginTop: 32 }} />
      <SectionTitle>商品图片</SectionTitle>
      <Row gutter={48}>
        <Col span={8}>
          <Form.Item
            name="mainImage"
            label="商品主图"
            rules={[{ required: true, message: '请上传商品主图' }]}
          >
            <SingleImageUpload />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            建议尺寸：800x800像素
          </Text>
        </Col>
        <Col span={16}>
          <Form.Item label="商品附图/轮播图" name="images">
            <MultiImageUpload />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            最多可上传 9 张图片
          </Text>
        </Col>
      </Row>
    </div>
  );
}

// 通用图片上传组件
interface ImageUploadProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  maxCount?: number;
  showIndex?: boolean;
}

function ImageUpload({
  value,
  onChange,
  maxCount = 1,
  showIndex,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const images: string[] = Array.isArray(value) ? value : value ? [value] : [];
  const isSingleMode = maxCount === 1;
  const shouldShowIndex = showIndex ?? !isSingleMode;

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const res = await uploadImage(file);
      if (isSingleMode) {
        onChange?.(res.url);
      } else {
        const newImages = [...images, res.url].slice(0, maxCount);
        onChange?.(newImages);
      }
      message.success('上传成功');
    } catch (error) {
      message.error('上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (isSingleMode) {
      onChange?.('');
    } else {
      const newImages = images.filter((_, i) => i !== index);
      onChange?.(newImages);
    }
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  };

  const renderImageItem = (url: string, index: number) => (
    <div
      key={index}
      style={{
        position: 'relative',
        width: 104,
        height: 104,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          border: '1px dashed #d9d9d9',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'pointer',
          background: '#fafafa',
          transition: 'all 0.3s',
        }}
        onClick={() => handlePreview(url)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#1677ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d9d9d9';
        }}
      >
        <img
          src={url}
          alt={`图片${index + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            color: '#fff',
            textAlign: 'center',
            fontSize: 12,
            padding: '8px 0 4px',
          }}
        >
          {shouldShowIndex ? `${index + 1}` : '预览'}
        </div>
      </div>
      <Button
        type="primary"
        danger
        size="small"
        shape="circle"
        icon={<DeleteOutlined style={{ fontSize: 10 }} />}
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 20,
          height: 20,
          padding: 0,
          minWidth: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          zIndex: 10,
        }}
        onClick={(e) => handleRemove(e, index)}
      />
    </div>
  );

  const renderUploadButton = () => (
    <Upload
      listType="picture-card"
      showUploadList={false}
      accept="image/*"
      customRequest={async ({ file, onSuccess, onError }) => {
        try {
          await handleUpload(file as File);
          onSuccess?.({ url: '' });
        } catch (error) {
          onError?.(error as Error);
        }
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: loading ? '#1677ff' : '#999',
        }}
      >
        {loading ? (
          <Spin size="small" />
        ) : (
          <>
            <UploadOutlined style={{ fontSize: 20, marginBottom: 8 }} />
            <span style={{ fontSize: 12 }}>上传图片</span>
          </>
        )}
      </div>
    </Upload>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {images.map((url, index) => renderImageItem(url, index))}
        {images.length < maxCount && renderUploadButton()}
      </div>

      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={600}
        centered
      >
        <img
          alt="预览"
          style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
}

function SingleImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  return <ImageUpload value={value} onChange={onChange as any} maxCount={1} />;
}

function MultiImageUpload({
  value,
  onChange,
}: {
  value?: string[];
  onChange?: (value: string[]) => void;
}) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange as any}
      maxCount={9}
      showIndex
    />
  );
}

// 规格组管理步骤组件（导出供列表页使用）
export function SpecGroupStep({
  productId,
  specGroups,
  onSpecGroupsChange,
  onRefreshProductDetail,
  inModal = false,
}: {
  productId: number | null;
  specGroups: ProductSpecGroup[];
  onSpecGroupsChange: (groups: ProductSpecGroup[]) => void;
  onRefreshProductDetail?: () => void;
  inModal?: boolean; // 是否在弹窗中使用
}) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newValueNames, setNewValueNames] = useState<Record<number, string>>(
    {},
  );

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      message.warning('请输入规格组名称');
      return;
    }
    if (!productId) {
      message.warning('请先保存商品基本信息');
      return;
    }
    try {
      await createProductSpecGroup({
        productId,
        name: newGroupName.trim(),
        sort: specGroups.length,
      });
      message.success('添加成功');
      setNewGroupName('');
      const res = await getProductSpecGroups({ productId });
      if (res) {
        onSpecGroupsChange(res);
      }
      onRefreshProductDetail?.();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleUpdateGroup = async (id: number, name: string, sort: number) => {
    try {
      await updateProductSpecGroup(id, { name, sort });
      message.success('更新成功');
      setEditingRow(null);
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res) {
          onSpecGroupsChange(res);
        }
        onRefreshProductDetail?.();
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteProductSpecGroup(id);
      message.success('删除成功');
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res) {
          onSpecGroupsChange(res);
        }
        onRefreshProductDetail?.();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleAddValue = async (specGroupId: number) => {
    const name = newValueNames[specGroupId]?.trim();
    if (!name) {
      message.warning('请输入规格值');
      return;
    }
    try {
      await createProductSpecValue({
        specGroupId,
        name,
        sort: 0,
      });
      message.success('添加成功');
      setNewValueNames((prev) => ({ ...prev, [specGroupId]: '' }));
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res) {
          onSpecGroupsChange(res);
        }
        onRefreshProductDetail?.();
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleDeleteValue = async (id: number) => {
    try {
      await deleteProductSpecValue(id);
      message.success('删除成功');
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res) {
          onSpecGroupsChange(res);
        }
        onRefreshProductDetail?.();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  if (!productId) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">请先完成第一步保存商品基本信息</Text>
          }
        />
      </div>
    );
  }

  return (
    <div style={inModal ? {} : { maxWidth: 900, margin: '0 auto' }}>
      {/* 添加规格组区域 */}
      <Card
        size="small"
        style={{
          marginBottom: 24,
          background: '#fafafa',
          borderStyle: 'dashed',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Input
            placeholder="新规格组名称，如：颜色、尺码"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onPressEnter={handleAddGroup}
            style={{ width: 280 }}
          />
          <PermissionButton
            type="primary"
            permission={MALL.PRODUCT_SPEC_GROUP.ADD}
            icon={<PlusOutlined />}
            onClick={handleAddGroup}
          >
            添加规格组
          </PermissionButton>
        </div>
      </Card>

      {specGroups.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">暂无规格组，请先添加</Text>}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {specGroups.map((group) => (
            <Card
              key={group.id}
              size="small"
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              styles={{
                header: {
                  background: '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                  padding: '12px 16px',
                },
                body: { padding: '16px' },
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {editingRow === group.id ? (
                    <>
                      <Input
                        defaultValue={group.name}
                        style={{ width: 150 }}
                        id={`group-name-${group.id}`}
                      />
                      <PermissionButton
                        type="link"
                        size="small"
                        permission={MALL.PRODUCT_SPEC_GROUP.EDIT}
                        onClick={() => {
                          const input = document.getElementById(
                            `group-name-${group.id}`,
                          ) as HTMLInputElement;
                          handleUpdateGroup(
                            group.id,
                            input?.value || group.name,
                            group.sort,
                          );
                        }}
                      >
                        保存
                      </PermissionButton>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setEditingRow(null)}
                      >
                        取消
                      </Button>
                    </>
                  ) : (
                    <>
                      <Text strong style={{ fontSize: 14 }}>
                        {group.name}
                      </Text>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setEditingRow(group.id)}
                        style={{ padding: '0 4px' }}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确认删除"
                        description="删除规格组将同时删除其下所有规格值"
                        onConfirm={() => handleDeleteGroup(group.id)}
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          style={{ padding: '0 4px' }}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </div>
              }
            >
              {/* 规格值列表 */}
              <div
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  minHeight: 32,
                }}
              >
                {(group.specValues || []).length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    暂无规格值，请在下方添加
                  </Text>
                ) : (
                  (group.specValues || []).map((value) => (
                    <Tag
                      key={value.id}
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        handleDeleteValue(value.id);
                      }}
                      color="blue"
                      style={{ margin: 0, padding: '4px 8px', fontSize: 13 }}
                    >
                      {value.name}
                    </Tag>
                  ))
                )}
              </div>
              {/* 添加规格值 */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 12,
                  borderTop: '1px dashed #f0f0f0',
                }}
              >
                <Input
                  placeholder="添加规格值，如：红色、蓝色"
                  value={newValueNames[group.id] || ''}
                  onChange={(e) =>
                    setNewValueNames((prev) => ({
                      ...prev,
                      [group.id]: e.target.value,
                    }))
                  }
                  onPressEnter={() => handleAddValue(group.id)}
                  style={{ width: 220 }}
                />
                <PermissionButton
                  size="small"
                  permission={MALL.PRODUCT_SPEC_VALUE.ADD}
                  icon={<PlusOutlined />}
                  onClick={() => handleAddValue(group.id)}
                >
                  添加规格值
                </PermissionButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// SKU管理步骤组件（导出供列表页使用）
export function SkuManageStep({
  productId,
  skuList,
  specGroups,
  onRefreshProductDetail,
  inModal = false,
}: {
  productId: number | null;
  skuList: ProductSku[];
  specGroups: ProductSpecGroup[];
  onSkuChange: (skus: ProductSku[]) => void;
  onRefreshProductDetail?: () => void;
  inModal?: boolean; // 是否在弹窗中使用
}) {
  const [loading, setLoading] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>(
    {},
  );
  const [baseSkuCode, setBaseSkuCode] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [baseCostPrice, setBaseCostPrice] = useState<number | undefined>(undefined);
  const [baseStock, setBaseStock] = useState(0);
  const [baseWeight, setBaseWeight] = useState<number | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  // 生成的 SKU 列表（可编辑）
  const [generatedSkus, setGeneratedSkus] = useState<any[]>([]);
  // 行内编辑状态
  const [editingSkuId, setEditingSkuId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<{
    skuCode: string;
    price: number;
    costPrice?: number;
    stock: number;
    weight?: number;
  } | null>(null);
  const [savingSkuId, setSavingSkuId] = useState<number | null>(null);

  // 根据选中的规格生成基础组合（仅计算规格组合和重复检测）
  const baseCombinations = useMemo(() => {
    const selectedGroups = specGroups.filter(
      (g) => selectedSpecs[g.name]?.length > 0,
    );
    if (selectedGroups.length === 0) {
      return [];
    }

    // 获取每个规格组选中的规格值
    const valueOptions: string[][] = selectedGroups.map(
      (group) => selectedSpecs[group.name] || [],
    );

    // 生成所有组合（笛卡尔积）
    const combinations: Record<string, string>[] = [];

    function generate(index: number, current: Record<string, string>) {
      if (index === selectedGroups.length) {
        combinations.push({ ...current });
        return;
      }

      const group = selectedGroups[index];
      const values = valueOptions[index] || [];

      for (const value of values) {
        current[group.name] = value;
        generate(index + 1, current);
      }
    }

    generate(0, {});

    // 检查已有 SKU 的规格组合，用于判断重复
    const existingSpecKeys = new Set(
      skuList.map((sku) => {
        const specs = typeof sku.specCombination === 'string'
          ? JSON.parse(sku.specCombination)
          : sku.specCombination;
        return JSON.stringify(specs);
      })
    );

    return combinations.map((combo) => {
      const specKey = JSON.stringify(combo);
      const isDuplicate = existingSpecKeys.has(specKey);
      return { specCombination: combo, isDuplicate };
    });
  }, [selectedSpecs, specGroups, skuList]);

  // 当规格选择变化时重新生成 SKU 列表
  useEffect(() => {
    if (baseCombinations.length === 0) {
      setGeneratedSkus([]);
      return;
    }

    const timestamp = Date.now();

    const skus = baseCombinations.map((base, index) => ({
      productId: productId || 0,
      skuCode: generateSkuCode(base.specCombination, baseSkuCode || undefined, timestamp + index),
      specCombination: base.specCombination,
      price: basePrice,
      costPrice: baseCostPrice,
      stock: baseStock,
      weight: baseWeight,
      sales: 0,
      isDuplicate: base.isDuplicate,
      originalIndex: index,
    }));

    setGeneratedSkus(skus);
  }, [baseCombinations]);

  // 更新单个 SKU 的字段
  const updateSkuField = (index: number, field: string, value: any) => {
    setGeneratedSkus((prev) => {
      const newSkus = [...prev];
      newSkus[index] = { ...newSkus[index], [field]: value };
      return newSkus;
    });
  };

  // 删除单个 SKU
  const removeSku = (index: number) => {
    setGeneratedSkus((prev) => prev.filter((_, i) => i !== index));
  };

  // 清空重复的 SKU
  const clearDuplicates = () => {
    setGeneratedSkus((prev) => prev.filter((sku) => !sku.isDuplicate));
  };

  // 批量应用设置到所有 SKU
  const applyBatchSettings = () => {
    const timestamp = Date.now();
    setGeneratedSkus((prev) =>
      prev.map((sku, index) => ({
        ...sku,
        skuCode: generateSkuCode(sku.specCombination, baseSkuCode || undefined, timestamp + index),
        price: basePrice,
        costPrice: baseCostPrice,
        stock: baseStock,
        weight: baseWeight,
      }))
    );
  };

  // 过滤出可提交的 SKU（非重复的）
  const validSkus = useMemo(() => generatedSkus.filter((sku) => !sku.isDuplicate), [generatedSkus]);
  const duplicateCount = generatedSkus.length - validSkus.length;

  const handleGenerateSkus = async () => {
    if (!productId) {
      message.warning('请先保存商品基本信息');
      return;
    }
    if (validSkus.length === 0) {
      if (duplicateCount > 0) {
        message.warning('所有规格组合均已存在，无需重复生成');
      } else {
        message.warning('请先选择规格');
      }
      return;
    }

    setLoading(true);
    try {
      // 只提交非重复的 SKU，并移除前端临时字段
      const skusToCreate = validSkus.map(({ isDuplicate, originalIndex, ...rest }) => rest);
      await bulkCreateProductSkus(skusToCreate);
      message.success(`成功生成 ${validSkus.length} 个 SKU`);

      // 刷新 SKU 列表
      onRefreshProductDetail?.();

      // 清空选择
      setSelectedSpecs({});
      setGeneratedSkus([]);
      setBaseSkuCode('');
      setBasePrice(0);
      setBaseCostPrice(undefined);
      setBaseStock(0);
      setBaseWeight(undefined);
    } catch (error: any) {
      message.error(error?.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return Number(value) || 0;
  };

  // 批量删除 SKU
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的 SKU');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个 SKU 吗？删除后无法恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setBatchDeleting(true);
        try {
          await bulkDeleteProductSkus({ ids: selectedRowKeys as number[] });
          message.success(`成功删除 ${selectedRowKeys.length} 个 SKU`);
          setSelectedRowKeys([]);
          onRefreshProductDetail?.();
        } catch (error: any) {
          message.error(error?.message || '批量删除失败');
        } finally {
          setBatchDeleting(false);
        }
      },
    });
  };

  // 开始行内编辑
  const startEditing = (record: ProductSku) => {
    setEditingSkuId(record.id);
    setEditingValues({
      skuCode: record.skuCode,
      price: toNumber(record.price),
      costPrice: record.costPrice ? toNumber(record.costPrice) : undefined,
      stock: record.stock,
      weight: record.weight ? toNumber(record.weight) : undefined,
    });
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingSkuId(null);
    setEditingValues(null);
  };

  // 保存编辑
  const saveEditing = async (id: number) => {
    if (!editingValues) return;
    setSavingSkuId(id);
    try {
      await updateProductSku(id, editingValues);
      message.success('更新成功');
      setEditingSkuId(null);
      setEditingValues(null);
      onRefreshProductDetail?.();
    } catch (error: any) {
      // 错误由全局拦截器处理
    } finally {
      setSavingSkuId(null);
    }
  };

  if (!productId) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">请先完成第一步保存商品基本信息</Text>
          }
        />
      </div>
    );
  }

  return (
    <div style={inModal ? {} : { maxWidth: 1000, margin: '0 auto' }}>
      {/* 规格选择 */}
      <Card
        size="small"
        style={{ marginBottom: 24, borderRadius: 8 }}
        styles={{
          header: { background: '#fafafa', padding: '12px 16px' },
          body: { padding: '20px 16px' },
        }}
        title={
          <Text strong style={{ fontSize: 14 }}>
            选择规格生成 SKU
          </Text>
        }
      >
        {specGroups.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                暂无规格，请先在上一步添加规格组和规格值
              </Text>
            }
          />
        ) : (
          <Row gutter={[24, 16]}>
            {specGroups.map((group) => (
              <Col key={group.id} xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 13 }}>
                    {group.name}
                  </Text>
                </div>
                <Select
                  mode="multiple"
                  value={selectedSpecs[group.name] || []}
                  onChange={(values) =>
                    setSelectedSpecs((prev) => ({
                      ...prev,
                      [group.name]: values,
                    }))
                  }
                  style={{ width: '100%' }}
                  placeholder="请选择（可多选）"
                  options={(group.specValues || []).map((value) => ({
                    label: value.name,
                    value: value.name,
                  }))}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 批量设置 */}
      {Object.values(selectedSpecs).some((arr) => arr.length > 0) && (
        <Card
          size="small"
          style={{
            marginBottom: 24,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f4f8 100%)',
            border: '1px solid #e8ecf0',
          }}
          styles={{ body: { padding: '20px 16px' } }}
        >
          <Text
            strong
            style={{ fontSize: 14, display: 'block', marginBottom: 16 }}
          >
            批量设置
          </Text>
          <Row gutter={[16, 12]} align="middle">
            <Col>
              <Space>
                <Text type="secondary">SKU 编码前缀</Text>
                <Input
                  placeholder="如：PRODUCT-001"
                  value={baseSkuCode}
                  onChange={(e) => setBaseSkuCode(e.target.value)}
                  style={{ width: 160 }}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">价格</Text>
                <InputNumber
                  min={0}
                  precision={2}
                  value={basePrice}
                  onChange={(v) => setBasePrice(v || 0)}
                  style={{ width: 120 }}
                  prefix="¥"
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">成本价</Text>
                <InputNumber
                  min={0}
                  precision={2}
                  value={baseCostPrice}
                  onChange={(v) => setBaseCostPrice(v || undefined)}
                  style={{ width: 120 }}
                  prefix="¥"
                  placeholder="选填"
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">库存</Text>
                <InputNumber
                  min={0}
                  precision={0}
                  value={baseStock}
                  onChange={(v) => setBaseStock(v || 0)}
                  style={{ width: 100 }}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">重量(kg)</Text>
                <InputNumber
                  min={0}
                  precision={2}
                  value={baseWeight}
                  onChange={(v) => setBaseWeight(v || undefined)}
                  style={{ width: 100 }}
                  placeholder="选填"
                />
              </Space>
            </Col>
            <Col>
              <Button
                onClick={applyBatchSettings}
                disabled={generatedSkus.length === 0}
              >
                应用到全部
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* SKU 预览 */}
      {generatedSkus.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 24, borderRadius: 8 }}
          styles={{
            header: { background: '#fffbe6', padding: '12px 16px' },
            body: { padding: 0 },
          }}
          title={
            <Space>
              <Text strong style={{ fontSize: 14, color: '#d48806' }}>
                将生成的 SKU 预览
              </Text>
              <Tag color="green">{validSkus.length} 条可创建</Tag>
              {duplicateCount > 0 && (
                <Tag color="red">{duplicateCount} 条重复</Tag>
              )}
            </Space>
          }
          extra={
            <Space>
              {duplicateCount > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={clearDuplicates}
                >
                  清空重复({duplicateCount})
                </Button>
              )}
              <Button
                type="link"
                danger
                size="small"
                onClick={() => {
                  setSelectedSpecs({});
                  setGeneratedSkus([]);
                }}
              >
                清空全部
              </Button>
              <PermissionButton
                type="primary"
                size="small"
                permission={MALL.PRODUCT_SKU.ADD}
                onClick={handleGenerateSkus}
                loading={loading}
                disabled={validSkus.length === 0}
              >
                确认生成 {validSkus.length} 个
              </PermissionButton>
            </Space>
          }
        >
          <Table
            size="small"
            dataSource={generatedSkus}
            rowKey={(_, index) => `preview-${index}`}
            rowClassName={(record) => record.isDuplicate ? 'ant-table-row-disabled' : ''}
            columns={[
              {
                title: '状态',
                dataIndex: 'isDuplicate',
                width: 80,
                render: (isDuplicate: boolean) =>
                  isDuplicate ? (
                    <Tag color="red">重复</Tag>
                  ) : (
                    <Tag color="green">新增</Tag>
                  ),
              },
              {
                title: 'SKU 编码',
                dataIndex: 'skuCode',
                width: 160,
                render: (v: string, _: any, index: number) => (
                  <Input
                    size="small"
                    value={v}
                    onChange={(e) => updateSkuField(index, 'skuCode', e.target.value)}
                    style={{ width: 140 }}
                  />
                ),
              },
              {
                title: '规格',
                dataIndex: 'specCombination',
                render: (specs: Record<string, string>) => {
                  if (!specs || typeof specs !== 'object') return '-';
                  return (
                    <Space size={4} wrap>
                      {Object.entries(specs).map(([k, v]) => (
                        <Tag key={k} color="blue" style={{ margin: 0 }}>
                          {k}: {v}
                        </Tag>
                      ))}
                    </Space>
                  );
                },
              },
              {
                title: '价格',
                dataIndex: 'price',
                width: 110,
                render: (v: number, _: any, index: number) => (
                  <InputNumber
                    size="small"
                    min={0}
                    precision={2}
                    value={v}
                    onChange={(val) => updateSkuField(index, 'price', val || 0)}
                    style={{ width: 90 }}
                    prefix="¥"
                  />
                ),
              },
              {
                title: '成本价',
                dataIndex: 'costPrice',
                width: 110,
                render: (v: number | undefined, _: any, index: number) => (
                  <InputNumber
                    size="small"
                    min={0}
                    precision={2}
                    value={v}
                    onChange={(val) => updateSkuField(index, 'costPrice', val || undefined)}
                    style={{ width: 90 }}
                    prefix="¥"
                    placeholder="选填"
                  />
                ),
              },
              {
                title: '库存',
                dataIndex: 'stock',
                width: 90,
                render: (v: number, _: any, index: number) => (
                  <InputNumber
                    size="small"
                    min={0}
                    precision={0}
                    value={v}
                    onChange={(val) => updateSkuField(index, 'stock', val || 0)}
                    style={{ width: 70 }}
                  />
                ),
              },
              {
                title: '重量(kg)',
                dataIndex: 'weight',
                width: 100,
                render: (v: number | undefined, _: any, index: number) => (
                  <InputNumber
                    size="small"
                    min={0}
                    precision={2}
                    value={v}
                    onChange={(val) => updateSkuField(index, 'weight', val || undefined)}
                    style={{ width: 80 }}
                    placeholder="选填"
                  />
                ),
              },
              {
                title: '操作',
                width: 70,
                render: (_: any, __: any, index: number) => (
                  <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeSku(index)}
                  >
                    删除
                  </Button>
                ),
              },
            ]}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        </Card>
      )}

      {/* 已有 SKU 列表 */}
      <Card
        size="small"
        style={{ borderRadius: 8 }}
        styles={{
          header: { background: '#fafafa', padding: '12px 16px' },
          body: { padding: 0 },
        }}
        title={
          <Space>
            <Text strong style={{ fontSize: 14 }}>
              已有 SKU
            </Text>
            <Tag color="blue">{skuList.length} 条</Tag>
            {selectedRowKeys.length > 0 && (
              <Tag color="orange">已选 {selectedRowKeys.length} 条</Tag>
            )}
          </Space>
        }
        extra={
          skuList.length > 0 && (
            <PermissionButton
              type="primary"
              danger
              size="small"
              permission={MALL.PRODUCT_SKU.REMOVE}
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              loading={batchDeleting}
              disabled={selectedRowKeys.length === 0}
            >
              批量删除 {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
            </PermissionButton>
          )
        }
      >
        {skuList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">暂无 SKU，请先配置规格并生成</Text>
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            size="small"
            dataSource={skuList}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            columns={[
              {
                title: 'SKU 编码',
                dataIndex: 'skuCode',
                width: 180,
                render: (_, record) => {
                  if (editingSkuId === record.id && editingValues) {
                    return (
                      <Input
                        size="small"
                        value={editingValues.skuCode}
                        onChange={(e) => setEditingValues({ ...editingValues, skuCode: e.target.value })}
                        style={{ width: 160 }}
                      />
                    );
                  }
                  return record.skuCode;
                },
              },
              {
                title: '规格组合',
                dataIndex: 'specCombination',
                render: (_, record) => {
                  let specs: Record<string, string> = {};
                  const rawSpecs = record.specCombination;
                  if (typeof rawSpecs === 'string') {
                    try {
                      specs = JSON.parse(rawSpecs);
                    } catch {
                      return <Text type="secondary">{rawSpecs}</Text>;
                    }
                  } else if (rawSpecs && typeof rawSpecs === 'object') {
                    specs = rawSpecs as Record<string, string>;
                  }
                  if (!specs || Object.keys(specs).length === 0) return '-';
                  return (
                    <Space size={4} wrap>
                      {Object.entries(specs).map(([key, value]) => (
                        <Tag key={key} color="blue" style={{ margin: 0 }}>
                          {key}: {String(value)}
                        </Tag>
                      ))}
                    </Space>
                  );
                },
              },
              {
                title: '价格',
                dataIndex: 'price',
                width: 110,
                render: (_, record) => {
                  if (editingSkuId === record.id && editingValues) {
                    return (
                      <InputNumber
                        size="small"
                        min={0}
                        precision={2}
                        value={editingValues.price}
                        onChange={(v) => setEditingValues({ ...editingValues, price: v || 0 })}
                        style={{ width: 90 }}
                        prefix="¥"
                      />
                    );
                  }
                  return (
                    <Text strong style={{ color: '#f5222d' }}>
                      ¥{toNumber(record.price).toFixed(2)}
                    </Text>
                  );
                },
              },
              {
                title: '成本价',
                dataIndex: 'costPrice',
                width: 110,
                render: (_, record) => {
                  if (editingSkuId === record.id && editingValues) {
                    return (
                      <InputNumber
                        size="small"
                        min={0}
                        precision={2}
                        value={editingValues.costPrice}
                        onChange={(v) => setEditingValues({ ...editingValues, costPrice: v || undefined })}
                        style={{ width: 90 }}
                        prefix="¥"
                      />
                    );
                  }
                  return record.costPrice ? `¥${toNumber(record.costPrice).toFixed(2)}` : '-';
                },
              },
              {
                title: '库存',
                dataIndex: 'stock',
                width: 90,
                render: (_, record) => {
                  if (editingSkuId === record.id && editingValues) {
                    return (
                      <InputNumber
                        size="small"
                        min={0}
                        precision={0}
                        value={editingValues.stock}
                        onChange={(v) => setEditingValues({ ...editingValues, stock: v || 0 })}
                        style={{ width: 70 }}
                      />
                    );
                  }
                  return record.stock;
                },
              },
              { title: '销量', dataIndex: 'sales', width: 80 },
              {
                title: '重量(kg)',
                dataIndex: 'weight',
                width: 100,
                render: (_, record) => {
                  if (editingSkuId === record.id && editingValues) {
                    return (
                      <InputNumber
                        size="small"
                        min={0}
                        precision={2}
                        value={editingValues.weight}
                        onChange={(v) => setEditingValues({ ...editingValues, weight: v || undefined })}
                        style={{ width: 80 }}
                      />
                    );
                  }
                  return record.weight ? toNumber(record.weight).toFixed(2) : '-';
                },
              },
              {
                title: '操作',
                width: 140,
                render: (_, record) => {
                  if (editingSkuId === record.id) {
                    return (
                      <Space size={4}>
                        <Button
                          type="link"
                          size="small"
                          icon={<SaveOutlined />}
                          loading={savingSkuId === record.id}
                          onClick={() => saveEditing(record.id)}
                        >
                          保存
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={cancelEditing}
                        >
                          取消
                        </Button>
                      </Space>
                    );
                  }
                  return (
                    <Space size={4}>
                      <PermissionButton
                        type="link"
                        size="small"
                        permission={MALL.PRODUCT_SKU.EDIT}
                        icon={<EditOutlined />}
                        onClick={() => startEditing(record)}
                      >
                        编辑
                      </PermissionButton>
                      <Popconfirm
                        title="确认删除"
                        description={
                          record.sales > 0
                            ? `该 SKU 已有 ${record.sales} 笔销量，删除后相关数据将不可恢复，确定删除吗？`
                            : '确定要删除该 SKU 吗？'
                        }
                        onConfirm={async () => {
                          try {
                            await deleteProductSku(record.id);
                            message.success('删除成功');
                            onRefreshProductDetail?.();
                          } catch (error) {
                            // 错误由全局拦截器处理
                          }
                        }}
                        okText="确定"
                        cancelText="取消"
                        okButtonProps={{
                          danger: true,
                        }}
                      >
                        <PermissionButton
                          type="link"
                          danger
                          size="small"
                          permission={MALL.PRODUCT_SKU.REMOVE}
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </PermissionButton>
                      </Popconfirm>
                    </Space>
                  );
                },
              },
            ]}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </div>
  );
}
