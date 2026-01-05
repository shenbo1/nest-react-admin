import request from '@/utils/request';

export type InvoiceType = 'ELECTRONIC' | 'PAPER' | 'VAT_SPECIAL';
export type InvoiceTitleType = 'PERSONAL' | 'COMPANY';

export interface MemberInvoice {
  id: number;
  memberId: number;
  invoiceType?: InvoiceType;
  invoiceTitleType?: InvoiceTitleType;
  invoiceTitle?: string;
  invoiceTaxNo?: string;
  invoiceContent?: string;
  invoiceEmail?: string;
  invoicePhone?: string;
  invoiceAddress?: string;
  bankName?: string;
  bankAccount?: string;
  isDefault: boolean;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: number;
    username: string;
    nickname?: string;
    phone?: string;
  };
}

export interface MemberInvoiceQuery {
  page?: number;
  pageSize?: number;
  memberId?: number;
  invoiceTitle?: string;
  invoiceTaxNo?: string;
  invoiceType?: InvoiceType;
  invoiceTitleType?: InvoiceTitleType;
}

export interface MemberInvoiceForm {
  memberId: number;
  invoiceType?: InvoiceType;
  invoiceTitleType?: InvoiceTitleType;
  invoiceTitle?: string;
  invoiceTaxNo?: string;
  invoiceContent?: string;
  invoiceEmail?: string;
  invoicePhone?: string;
  invoiceAddress?: string;
  bankName?: string;
  bankAccount?: string;
  isDefault?: boolean;
  remark?: string;
}

export const memberInvoiceApi = {
  /** 获取发票信息列表 */
  list(params?: MemberInvoiceQuery) {
    return request.get<{ data: MemberInvoice[]; total: number }>(
      '/mall/member-invoice',
      { params },
    );
  },

  /** 获取会员的所有发票信息 */
  listByMember(memberId: number) {
    return request.get<MemberInvoice[]>(`/mall/member-invoice/member/${memberId}`);
  },

  /** 获取发票信息详情 */
  get(id: number) {
    return request.get<MemberInvoice>(`/mall/member-invoice/${id}`);
  },

  /** 创建发票信息 */
  create(data: MemberInvoiceForm) {
    return request.post<MemberInvoice>('/mall/member-invoice', data);
  },

  /** 更新发票信息 */
  update(id: number, data: Partial<MemberInvoiceForm>) {
    return request.put<MemberInvoice>(`/mall/member-invoice/${id}`, data);
  },

  /** 删除发票信息 */
  delete(id: number) {
    return request.delete(`/mall/member-invoice/${id}`);
  },

  /** 设置默认发票信息 */
  setDefault(id: number) {
    return request.put<MemberInvoice>(`/mall/member-invoice/${id}/set-default`);
  },
};
