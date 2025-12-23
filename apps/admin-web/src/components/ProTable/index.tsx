import { useRef, forwardRef, useImperativeHandle, ReactNode } from 'react';
import { ActionType, ProTable as ProTableComponent, ProColumns } from '@ant-design/pro-components';
import request from '@/utils/request';

export interface ProTableRef {
  reload: () => void;
  reloadAndRest: () => void;
  reset: () => void;
}

interface BaseProTableProps<T = any> {
  api?: string;
  columns?: ProColumns<T>[];
  rowKey?: string | ((record: T) => string);
  scroll?: { x?: number; y?: number };
  search?: any;
  pagination?: any;
  toolBarRender?: () => ReactNode[];
  rowSelection?: any;
  headerTitle?: ReactNode | string;
  [key: string]: any;
}

interface RequestFunc<T = any> {
  (params: any): Promise<{
    data: T[];
    total: number;
    success: boolean;
  }>;
}

interface ApiProTableProps<T = any> extends BaseProTableProps<T> {
  api: string;
  request?: never;
}

interface RequestProTableProps<T = any> extends BaseProTableProps<T> {
  api?: never;
  request: RequestFunc<T>;
}

export type ProTableProps<T = any> = ApiProTableProps<T> | RequestProTableProps<T>;

/**
 * 通用 ProTable 组件
 * 自动处理分页参数转换 (current -> page)
 * 暴露 actionRef 给外部使用
 */
const ProTable = forwardRef<ProTableRef, ProTableProps>(function ProTable(props, ref) {
  const { api, columns, rowKey = 'id', request: requestFunc, ...rest } = props;
  const actionRef = useRef<ActionType>(null);

  useImperativeHandle(ref, () => ({
    reload: () => {
      const current = actionRef.current;
      if (current && typeof current.reload === 'function') {
        current.reload();
      }
    },
    reloadAndRest: () => {
      const current = actionRef.current;
      if (current && typeof current.reloadAndRest === 'function') {
        current.reloadAndRest();
      }
    },
    reset: () => {
      const current = actionRef.current;
      if (current && typeof current.reset === 'function') {
        current.reset();
      }
    },
  }));

  const handleRequest = async (params: any) => {
    if (requestFunc) {
      // 如果传入自定义请求函数，直接使用
      return requestFunc(params);
    }

    // 默认处理：API + 分页参数转换
    const { current, pageSize, ...restParams } = params;
    const result = await request.get(api!, {
      params: { page: current, pageSize, ...restParams },
    }) as any;
    // request 已经处理了响应拦截器，直接返回
    return {
      data: result.data,
      total: result.total,
      success: true,
    };
  };

  return (
    <ProTableComponent
      actionRef={actionRef}
      columns={columns}
      rowKey={rowKey}
      request={handleRequest}
      {...rest}
    />
  );
}) as <T = any>(props: ProTableProps<T> & { ref?: React.Ref<ProTableRef> }) => React.ReactElement;

export default ProTable;
