import request from '@/utils/request';

export interface Member {
  id: number;
  username: string;
}

export interface Order {
  id: number;
  orderNo: string;
  memberId?: number;
  member?: Member;
  items?: any;
  totalAmount: number;
  discountAmount?: number;
  freight?: number;
  actualAmount: number;
  payAmount?: number;
  status: number;
  payStatus: number;
  shippingStatus: number;
  paymentMethod?: string;
  paymentTime?: string;
  shippingTime?: string;
  receivedTime?: string;
  receiver?: string;
  phone?: string;
  address?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderQuery {
  page?: number;
  pageSize?: number;
  orderNo?: string;
  status?: number;
  payStatus?: number;
  receiver?: string;
}

export interface OrderForm {
  orderNo?: string;
  memberId?: number;
  items?: any;
  totalAmount?: number;
  discountAmount?: number;
  freight?: number;
  actualAmount?: number;
  status?: number;
  payStatus?: number;
  shippingStatus?: number;
  paymentMethod?: string;
  receiver?: string;
  phone?: string;
  address?: string;
  remark?: string;
}

export const orderApi = {
  /** 获取订单管理列表 */
  list(params?: OrderQuery) {
    return request.get<{ list: Order[]; total: number }>('/mall/order', { params });
  },

  /** 获取订单管理详情 */
  get(id: number) {
    return request.get<Order>(`/mall/order/${id}`);
  },

  /** 创建订单管理 */
  create(data: OrderForm) {
    return request.post<Order>('/mall/order', data);
  },

  /** 更新订单管理 */
  update(id: number, data: Partial<OrderForm>) {
    return request.put<Order>(`/mall/order/${id}`, data);
  },

  /** 删除订单管理 */
  delete(id: number) {
    return request.delete(`/mall/order/${id}`);
  },
};
