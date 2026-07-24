import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Check if AWS RDS or PostgreSQL environment variables are configured
const isDbConfigured = Boolean(
  process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_NAME)
);

let pool = null;

if (isDbConfigured) {
  const config = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
      };

  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle AWS RDS PostgreSQL client', err);
  });
} else {
  console.log('ℹ️ [Database] AWS RDS / PostgreSQL environment variables not set. Using in-memory log store.');
}

// In-memory fallback if database is not configured
const inMemoryLogs = [];

// Initialize database schema tables
export async function initDb() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    console.log('⚡ [AWS RDS] Successfully connected to PostgreSQL database!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_code VARCHAR(10) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS transfer_logs (
        id SERIAL PRIMARY KEY,
        file_id VARCHAR(100) NOT NULL,
        room_code VARCHAR(10) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        file_type VARCHAR(100),
        sender_alias VARCHAR(100),
        receiver_alias VARCHAR(100),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    console.log('✅ [AWS RDS] Schema tables initialized.');
  } catch (err) {
    console.error('❌ [AWS RDS] Failed to initialize database tables:', err.message);
  }
}

// Log a file transfer to AWS RDS PostgreSQL
export async function logTransfer({ fileId, roomCode, fileName, fileSizeBytes, fileType, senderAlias, receiverAlias, status = 'completed' }) {
  const logEntry = {
    fileId,
    roomCode,
    fileName,
    fileSizeBytes: Number(fileSizeBytes),
    fileType,
    senderAlias,
    receiverAlias,
    status,
    createdAt: new Date().toISOString()
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO transfer_logs (file_id, room_code, file_name, file_size_bytes, file_type, sender_alias, receiver_alias, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [fileId, roomCode, fileName, fileSizeBytes, fileType, senderAlias, receiverAlias, status]
      );
      console.log(`[AWS RDS] Logged transfer of file: ${fileName} (${fileSizeBytes} bytes)`);
    } catch (err) {
      console.error('[AWS RDS Error] Failed to insert transfer log:', err.message);
    }
  } else {
    inMemoryLogs.unshift(logEntry);
    if (inMemoryLogs.length > 100) inMemoryLogs.pop();
  }
}

// Get recent transfer logs
export async function getTransferHistory(limit = 20) {
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, file_id as "fileId", room_code as "roomCode", file_name as "fileName", 
                file_size_bytes as "fileSizeBytes", file_type as "fileType", 
                sender_alias as "senderAlias", receiver_alias as "receiverAlias", 
                status, created_at as "createdAt"
         FROM transfer_logs
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      return res.rows;
    } catch (err) {
      console.error('[AWS RDS Error] Failed to fetch transfer history:', err.message);
      return [];
    }
  }
  return inMemoryLogs.slice(0, limit);
}

// Get aggregate transfer stats
export async function getStats() {
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT 
          COUNT(*)::int as "totalTransfers",
          COALESCE(SUM(file_size_bytes), 0)::bigint as "totalBytesTransferred"
        FROM transfer_logs
        WHERE status = 'completed'
      `);
      return res.rows[0];
    } catch (err) {
      console.error('[AWS RDS Error] Failed to fetch stats:', err.message);
      return { totalTransfers: 0, totalBytesTransferred: 0 };
    }
  }

  const totalBytes = inMemoryLogs.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
  return {
    totalTransfers: inMemoryLogs.length,
    totalBytesTransferred: totalBytes
  };
}
