import { useNavigate, useParams } from 'react-router-dom';
import {
  Space,
  Tag,
  Table,
  Card,
  Descriptions,
  Image,
  Typography,
  Spin,
  Empty,
  Row,
  Col,
  Button,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  ShopOutlined,
  TagOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/services/mall/product';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';

const { Text, Title } = Typography;

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

// 辅助函数：格式化金额
const formatPrice = (value: any): string => {
  return toNumber(value).toFixed(2);
};

// 状态标签
const StatusTag = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { text: string; color: string }> = {
    ON_SHELF: { text: '上架', color: 'green' },
    OFF_SHELF: { text: '下架', color: 'red' },
    DRAFT: { text: '草稿', color: 'orange' },
  };
  const config = statusConfig[status] || { text: '未知', color: 'default' };
  return <Tag color={config.color}>{config.text}</Tag>;
};

// 解析规格组合
const parseSpecCombination = (specs: Record<string, string> | string) => {
  let parsedSpecs = specs;
  if (typeof specs === 'string') {
    try {
      parsedSpecs = JSON.parse(specs);
    } catch {
      return <span style={{ color: '#999' }}>{specs}</span>;
    }
  }
  if (!parsedSpecs || typeof parsedSpecs !== 'object') return '-';
  return (
    <Space size="small" wrap>
      {Object.entries(parsedSpecs).map(([key, value]) => (
        <Tag key={key} color="blue">
          {key}: {String(value)}
        </Tag>
      ))}
    </Space>
  );
};

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : null;

  // 获取商品详情
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.get(productId!),
    enabled: !!productId,
  });

  const handleGoBack = () => {
    navigate('/mall/product');
  };

  const handleEdit = () => {
    navigate(`/mall/product/edit/${productId}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer>
        <Empty description="商品不存在" />
      </PageContainer>
    );
  }

  const specGroups = product.specGroups || [];
  const skuList = product.skus || [];

  // SKU 表格列
  const skuColumns = [
    {
      title: 'SKU编码',
      dataIndex: 'skuCode',
      width: 200,
      render: (skuCode: string) => (
        <Typography.Text
          copyable={{ tooltips: ['点击复制', '复制成功'] }}
          style={{ margin: 0 }}
        >
          {skuCode}
        </Typography.Text>
      ),
    },
    {
      title: '规格组合',
      dataIndex: 'specCombination',
      width: 220,
      render: (specs: any) => parseSpecCombination(specs),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      align: 'right' as const,
      render: (price: any) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{formatPrice(price)}
        </span>
      ),
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      width: 100,
      align: 'right' as const,
      render: (costPrice: any) => (costPrice ? `¥${formatPrice(costPrice)}` : '-'),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 80,
      align: 'center' as const,
      render: (stock: number) => (
        <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock}
        </Tag>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      width: 70,
      align: 'center' as const,
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      width: 90,
      align: 'right' as const,
      render: (weight: any) => (weight ? formatPrice(weight) : '-'),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '商品详情',
        breadcrumb: {
          items: [
            { title: '商城管理' },
            { title: '商品管理', path: '/mall/product' },
            { title: '商品详情' },
          ],
        },
        extra: [
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
            返回列表
          </Button>,
          product.status !== 'ON_SHELF' && (
            <PermissionButton
              key="edit"
              permission={MALL.PRODUCT.EDIT}
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              编辑商品
            </PermissionButton>
          ),
        ],
      }}
    >
      {/* 基本信息 */}
      <Card title={<><ShopOutlined /> 基本信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              {product.mainImage ? (
                <Image
                  src={product.mainImage}
                  alt={product.name}
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    borderRadius: 8,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 200,
                    height: 200,
                    background: '#f5f5f5',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                  }}
                >
                  <Text type="secondary">暂无图片</Text>
                </div>
              )}
            </div>
          </Col>
          <Col span={18}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="商品名称" span={2}>
                <Title level={5} style={{ margin: 0 }}>{product.name}</Title>
              </Descriptions.Item>
              <Descriptions.Item label="商品编码">
                <Typography.Text copyable>{product.code || '-'}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="销售状态">
                <StatusTag status={product.status} />
              </Descriptions.Item>
              <Descriptions.Item label="商品分类">
                {product.category?.name ? (
                  <Tag color="blue">{product.category.name}</Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="排序">
                {product.sort || 0}
              </Descriptions.Item>
              <Descriptions.Item label="默认价格">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>
                  ¥{formatPrice(product.defaultPrice)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="原价">
                {product.originalPrice ? (
                  <span style={{ textDecoration: 'line-through', color: '#999' }}>
                    ¥{formatPrice(product.originalPrice)}
                  </span>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="默认库存">
                <Tag color={toNumber(product.defaultStock) > 10 ? 'green' : toNumber(product.defaultStock) > 0 ? 'orange' : 'red'}>
                  {toNumber(product.defaultStock)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="销量">
                {product.sales || 0}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {product.createdAt ? new Date(product.createdAt).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* 商品描述 */}
      {product.content && (
        <Card title="商品描述" style={{ marginBottom: 16 }}>
          <div
            dangerouslySetInnerHTML={{ __html: product.content }}
            style={{ lineHeight: 1.8 }}
          />
        </Card>
      )}

      {/* 商品图片 */}
      {product.images && product.images.length > 0 && (
        <Card title="商品图片" style={{ marginBottom: 16 }}>
          <Image.PreviewGroup>
            <Space wrap>
              {product.images.map((img: string, index: number) => (
                <Image
                  key={index}
                  src={img}
                  alt={`商品图片${index + 1}`}
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        </Card>
      )}

      {/* 规格信息 */}
      <Card
        title={<><TagOutlined /> 规格信息</>}
        style={{ marginBottom: 16 }}
      >
        {specGroups.length > 0 ? (
          <Row gutter={[16, 16]}>
            {specGroups.map((group: any) => (
              <Col key={group.id} span={8}>
                <Card size="small" title={group.name} bordered>
                  <Space wrap>
                    {(group.specValues || []).map((value: any) => (
                      <Tag key={value.id} color="blue">
                        {value.name}
                      </Tag>
                    ))}
                  </Space>
                  {(!group.specValues || group.specValues.length === 0) && (
                    <Text type="secondary">暂无规格值</Text>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无规格信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* SKU 列表 */}
      <Card title={<><AppstoreOutlined /> SKU 列表 ({skuList.length}个)</>}>
        {skuList.length > 0 ? (
          <Table
            dataSource={skuList}
            columns={skuColumns}
            rowKey="id"
            pagination={skuList.length > 10 ? { pageSize: 10, showTotal: (total) => `共 ${total} 条` } : false}
            scroll={{ x: 800 }}
            size="small"
          />
        ) : (
          <Empty description="暂无 SKU 信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </PageContainer>
  );
}
