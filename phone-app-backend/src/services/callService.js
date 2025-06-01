import { ClickHouse } from 'clickhouse';
//import redis from '../config/redis.js';

class CallService {
  constructor() {
    this.clickhouse = new ClickHouse({
      url: process.env.CLICKHOUSE_URL,
      port: 8123,
      debug: false,
      basicAuth: null,
      isUseGzip: false,
      format: 'json',
      raw: false,
      config: {
        session_timeout: 60,
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0,
        database: 'default',
      },
    });
  }

  async logCall(callData) {
    const query = `
      INSERT INTO call_logs (
        call_id, from_user_id, to_user_id, to_phone_number,
        call_type, status, start_time, end_time, duration,
        quality_score, connection_type
      ) VALUES (
        '${callData.callId}', '${callData.fromUserId}', 
        '${callData.toUserId || ''}', '${callData.toPhoneNumber}',
        '${callData.callType}', '${callData.status}',
        '${callData.startTime}', ${callData.endTime ? `'${callData.endTime}'` : 'NULL'},
        ${callData.duration || 0}, ${callData.qualityScore || 0},
        '${callData.connectionType || 'unknown'}'
      )
    `;
    
    return this.clickhouse.query(query).toPromise();
  }

  async getCallHistory(userId, page = 1, limit = 50, filters = {}) {
    const offset = (page - 1) * limit;
    
    let whereClause = `from_user_id = '${userId}'`;
    
    if (filters.callType) {
      whereClause += ` AND call_type = '${filters.callType}'`;
    }
    
    if (filters.status) {
      whereClause += ` AND status = '${filters.status}'`;
    }
    
    if (filters.dateFrom) {
      whereClause += ` AND start_time >= '${filters.dateFrom}'`;
    }
    
    if (filters.dateTo) {
      whereClause += ` AND start_time <= '${filters.dateTo}'`;
    }
    
    const query = `
      SELECT *
      FROM call_logs
      WHERE ${whereClause}
      ORDER BY start_time DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    return this.clickhouse.query(query).toPromise();
  }

  async getCallAnalytics(userId, period = '7d') {
    const query = `
      SELECT
        call_type,
        status,
        COUNT(*) as call_count,
        AVG(duration) as avg_duration,
        SUM(duration) as total_duration
      FROM call_logs
      WHERE from_user_id = '${userId}'
        AND start_time >= now() - INTERVAL ${period}
      GROUP BY call_type, status
      ORDER BY call_count DESC
    `;
    
    return this.clickhouse.query(query).toPromise();
  }

  async updateCallStatus(callId, status, endTime = null, duration = null) {
    let query = `
      ALTER TABLE call_logs
      UPDATE status = '${status}'
    `;
    
    if (endTime) {
      query += `, end_time = '${endTime}'`;
    }
    
    if (duration) {
      query += `, duration = ${duration}`;
    }
    
    query += ` WHERE call_id = '${callId}'`;
    
    return this.clickhouse.query(query).toPromise();
  }
}

export default new CallService();