import request from '@/utils/request';

// 积分兑换记录接口
export interface PointExchangeRecord {
  id: number;
  exchangeNo: string;
  memberId: number;
  pointProductId: number;
  productName: string;
  productType: 'PHYSICAL' | 'VIRTUAL' | 'COUPON';
  quantity: number;
  points: number;
  price?: number;
  status: 'PENDING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  addressInfo?: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };
  shippingInfo?: {
    expressCompany: string;
    expressNo: string;
    shippedAt: string;
  };
  virtualContent?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  pointProduct?: {
    id: number;
    name: string;
    code: string;
    image?: string;
    points?: number;
    price?: number;
  };
}

// 发货表单
export interface ShipForm {
  expressCompany: string;
  expressNo: string;
  remark?: string;
}

// 查询参数
export interface PointExchangeQuery {
  exchangeNo?: string;
  memberId?: number;
  productName?: string;
  productType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// 统计数据
export interface PointExchangeStats {
  pending: number;
  shipped: number;
  completed: number;
  cancelled: number;
  total: number;
}

// API 方法
export const pointExchangeApi = {
  // 获取列表
  list(params?: PointExchangeQuery) {
    return request.get<{ data: PointExchangeRecord[]; total: number }>(
      '/marketing/point-exchange',
      { params }
    );
  },

  // 获取统计数据
  getStats() {
    return request.get<PointExchangeStats>('/marketing/point-exchange/stats');
  },

  // 获取详情
  get(id: number) {
    return request.get<PointExchangeRecord>(`/marketing/point-exchange/${id}`);
  },

  // 发货
  ship(id: number, data: ShipForm) {
    return request.put<PointExchangeRecord>(`/marketing/point-exchange/${id}/ship`, data);
  },

  // 完成兑换
  complete(id: number) {
    return request.put<PointExchangeRecord>(`/marketing/point-exchange/${id}/complete`);
  },

  // 取消兑换
  cancel(id: number) {
    return request.put<PointExchangeRecord>(`/marketing/point-exchange/${id}/cancel`);
  },
};
