import request from '@/utils/request';

// 签到记录接口
export interface MemberSignIn {
  id: number;
  memberId: number;
  signDate: string;
  points: number;
  basePoints: number;
  bonusPoints: number;
  consecutiveDays: number;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: number;
    username: string;
    realName: string;
  };
}

// 按日期统计
export interface SignInStatsByDate {
  date: string;
  signCount: number;
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
}

// 月度统计
export interface MonthlyStats {
  year: number;
  month: number;
  totalSignIns: number;
  activeMembers: number;
  totalPoints: number;
  avgConsecutiveDays: number;
}

// 排行
export interface MemberRanking {
  rank: number;
  memberId: number;
  username: string;
  realName: string;
  consecutiveDays: number;
  lastSignDate: string;
}

// 查询参数
export interface SignInQuery {
  memberId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// API 方法
export const signInApi = {
  // 获取列表
  list(params?: SignInQuery) {
    return request.get<{ data: MemberSignIn[]; total: number }>(
      '/marketing/sign-in',
      { params }
    );
  },

  // 获取详情
  get(id: number) {
    return request.get<MemberSignIn>(`/marketing/sign-in/${id}`);
  },

  // 按日期统计
  getStatsByDate(startDate: string, endDate: string) {
    return request.get<SignInStatsByDate[]>(
      '/marketing/sign-in/stats/by-date',
      { params: { startDate, endDate } }
    );
  },

  // 月度统计
  getMonthlyStats(year: number, month: number) {
    return request.get<MonthlyStats>(
      '/marketing/sign-in/stats/monthly',
      { params: { year, month } }
    );
  },

  // 会员排行
  getMemberRanking(limit: number = 10) {
    return request.get<MemberRanking[]>(
      '/marketing/sign-in/stats/ranking',
      { params: { limit } }
    );
  },
};