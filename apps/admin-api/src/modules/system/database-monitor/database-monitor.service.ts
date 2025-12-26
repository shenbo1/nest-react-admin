import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface TableInfo {
  name: string;
  rows: number;
  dataSize: string;
  indexSize: string;
  totalSize: string;
  comment: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
  comment: string | null;
}

export interface ConnectionInfo {
  pid: number;
  username: string;
  database: string;
  clientAddr: string;
  state: string;
  query: string;
  queryStart: Date | null;
  stateChange: Date | null;
}

export interface SlowQuery {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
}

@Injectable()
export class DatabaseMonitorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取数据库基本信息
   */
  async getDatabaseInfo() {
    const [versionResult, sizeResult, statsResult] = await Promise.all([
      this.prisma.$queryRaw<{ version: string }[]>`SELECT version()`,
      this.prisma.$queryRaw<{ size: string }[]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `,
      this.prisma.$queryRaw<{
        numbackends: bigint;
        xact_commit: bigint;
        xact_rollback: bigint;
        blks_read: bigint;
        blks_hit: bigint;
        tup_returned: bigint;
        tup_fetched: bigint;
        tup_inserted: bigint;
        tup_updated: bigint;
        tup_deleted: bigint;
        conflicts: bigint;
        deadlocks: bigint;
      }[]>`
        SELECT
          numbackends,
          xact_commit,
          xact_rollback,
          blks_read,
          blks_hit,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted,
          conflicts,
          deadlocks
        FROM pg_stat_database
        WHERE datname = current_database()
      `,
    ]);

    const stats = statsResult[0];
    const blksRead = Number(stats?.blks_read || 0);
    const blksHit = Number(stats?.blks_hit || 0);
    const cacheHitRatio = blksRead + blksHit > 0
      ? ((blksHit / (blksRead + blksHit)) * 100).toFixed(2)
      : '0.00';

    return {
      version: versionResult[0]?.version || 'Unknown',
      size: sizeResult[0]?.size || 'Unknown',
      connections: Number(stats?.numbackends || 0),
      transactions: {
        commit: Number(stats?.xact_commit || 0),
        rollback: Number(stats?.xact_rollback || 0),
      },
      cacheHitRatio: `${cacheHitRatio}%`,
      tuples: {
        returned: Number(stats?.tup_returned || 0),
        fetched: Number(stats?.tup_fetched || 0),
        inserted: Number(stats?.tup_inserted || 0),
        updated: Number(stats?.tup_updated || 0),
        deleted: Number(stats?.tup_deleted || 0),
      },
      conflicts: Number(stats?.conflicts || 0),
      deadlocks: Number(stats?.deadlocks || 0),
    };
  }

  /**
   * 获取所有表信息
   */
  async getTableInfo(): Promise<TableInfo[]> {
    const tables = await this.prisma.$queryRaw<{
      table_name: string;
      row_estimate: bigint;
      data_size: string;
      index_size: string;
      total_size: string;
      description: string | null;
    }[]>`
      SELECT
        c.relname as table_name,
        c.reltuples::bigint as row_estimate,
        pg_size_pretty(pg_table_size(c.oid)) as data_size,
        pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
        obj_description(c.oid) as description
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'
        AND n.nspname = 'public'
      ORDER BY pg_total_relation_size(c.oid) DESC
    `;

    return tables.map((t) => ({
      name: t.table_name,
      rows: Number(t.row_estimate),
      dataSize: t.data_size,
      indexSize: t.index_size,
      totalSize: t.total_size,
      comment: t.description || '',
    }));
  }

  /**
   * 获取当前数据库连接
   */
  async getConnections(): Promise<ConnectionInfo[]> {
    const connections = await this.prisma.$queryRaw<{
      pid: number;
      usename: string;
      datname: string;
      client_addr: string | null;
      state: string;
      query: string;
      query_start: Date | null;
      state_change: Date | null;
    }[]>`
      SELECT
        pid,
        usename,
        datname,
        client_addr::text,
        state,
        query,
        query_start,
        state_change
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
      ORDER BY query_start DESC NULLS LAST
    `;

    return connections.map((c) => ({
      pid: c.pid,
      username: c.usename || '',
      database: c.datname || '',
      clientAddr: c.client_addr || 'local',
      state: c.state || 'unknown',
      query: c.query || '',
      queryStart: c.query_start,
      stateChange: c.state_change,
    }));
  }

  /**
   * 获取连接池状态
   */
  async getConnectionPoolStatus() {
    const [maxConnResult, currentConnResult] = await Promise.all([
      this.prisma.$queryRaw<{ setting: string }[]>`
        SELECT setting FROM pg_settings WHERE name = 'max_connections'
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()
      `,
    ]);

    const maxConnections = parseInt(maxConnResult[0]?.setting || '100', 10);
    const currentConnections = Number(currentConnResult[0]?.count || 0);

    return {
      maxConnections,
      currentConnections,
      availableConnections: maxConnections - currentConnections,
      usagePercentage: ((currentConnections / maxConnections) * 100).toFixed(2),
    };
  }

  /**
   * 获取慢查询（需要开启 pg_stat_statements 扩展）
   */
  async getSlowQueries(limit = 20): Promise<SlowQuery[]> {
    try {
      const queries = await this.prisma.$queryRaw<{
        query: string;
        calls: bigint;
        total_time: number;
        mean_time: number;
        min_time: number;
        max_time: number;
      }[]>`
        SELECT
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as mean_time,
          min_exec_time as min_time,
          max_exec_time as max_time
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
        ORDER BY mean_exec_time DESC
        LIMIT ${limit}
      `;

      return queries.map((q) => ({
        query: q.query,
        calls: Number(q.calls),
        totalTime: q.total_time,
        meanTime: q.mean_time,
        minTime: q.min_time,
        maxTime: q.max_time,
      }));
    } catch {
      // pg_stat_statements 扩展未安装
      return [];
    }
  }

  /**
   * 获取索引使用情况
   */
  async getIndexUsage() {
    const indexes = await this.prisma.$queryRaw<{
      table_name: string;
      index_name: string;
      index_size: string;
      idx_scan: bigint;
      idx_tup_read: bigint;
      idx_tup_fetch: bigint;
    }[]>`
      SELECT
        t.relname as table_name,
        i.relname as index_name,
        pg_size_pretty(pg_relation_size(i.oid)) as index_size,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
      FROM pg_stat_user_indexes s
      JOIN pg_index idx ON s.indexrelid = idx.indexrelid
      JOIN pg_class i ON i.oid = idx.indexrelid
      JOIN pg_class t ON t.oid = idx.indrelid
      ORDER BY s.idx_scan DESC
      LIMIT 50
    `;

    return indexes.map((i) => ({
      tableName: i.table_name,
      indexName: i.index_name,
      indexSize: i.index_size,
      scans: Number(i.idx_scan),
      tuplesRead: Number(i.idx_tup_read),
      tuplesFetched: Number(i.idx_tup_fetch),
    }));
  }

  /**
   * 获取未使用的索引
   */
  async getUnusedIndexes() {
    const indexes = await this.prisma.$queryRaw<{
      table_name: string;
      index_name: string;
      index_size: string;
    }[]>`
      SELECT
        t.relname as table_name,
        i.relname as index_name,
        pg_size_pretty(pg_relation_size(i.oid)) as index_size
      FROM pg_stat_user_indexes s
      JOIN pg_index idx ON s.indexrelid = idx.indexrelid
      JOIN pg_class i ON i.oid = idx.indexrelid
      JOIN pg_class t ON t.oid = idx.indrelid
      WHERE s.idx_scan = 0
        AND NOT idx.indisprimary
        AND NOT idx.indisunique
      ORDER BY pg_relation_size(i.oid) DESC
    `;

    return indexes.map((i) => ({
      tableName: i.table_name,
      indexName: i.index_name,
      indexSize: i.index_size,
    }));
  }

  /**
   * 获取锁信息
   */
  async getLocks() {
    const locks = await this.prisma.$queryRaw<{
      pid: number;
      relation: string;
      mode: string;
      granted: boolean;
      query: string;
    }[]>`
      SELECT
        l.pid,
        COALESCE(c.relname, 'N/A') as relation,
        l.mode,
        l.granted,
        a.query
      FROM pg_locks l
      LEFT JOIN pg_class c ON l.relation = c.oid
      LEFT JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
        AND l.pid != pg_backend_pid()
      ORDER BY l.granted, l.pid
    `;

    return locks;
  }

  /**
   * 终止指定连接
   */
  async terminateConnection(pid: number) {
    await this.prisma.$queryRaw`SELECT pg_terminate_backend(${pid})`;
    return { success: true, message: `Connection ${pid} terminated` };
  }

  /**
   * 获取表列信息
   */
  async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const columns = await this.prisma.$queryRaw<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      is_primary_key: boolean;
      description: string | null;
    }[]>`
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage cu
            ON tc.constraint_name = cu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_name = c.table_name
            AND cu.column_name = c.column_name
        ) as is_primary_key,
        COALESCE(pg_catalog.col_description(
          (SELECT oid FROM pg_class WHERE relname = c.table_name),
          c.ordinal_position
        ), null) as description
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = ${tableName}
      ORDER BY c.ordinal_position
    `;

    return columns.map((c) => ({
      name: c.column_name,
      type: c.data_type,
      isNullable: c.is_nullable === 'YES',
      isPrimaryKey: c.is_primary_key,
      defaultValue: c.column_default,
      comment: c.description,
    }));
  }
}
