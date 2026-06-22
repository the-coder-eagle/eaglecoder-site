// MySQL 连接池
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'oj',
  password: process.env.DB_PASSWORD || 'EagleOJ2024!',
  database: process.env.DB_NAME || 'eaglecoder_oj',
  waitForConnections: true,
  connectionLimit: 5,
  charset: 'utf8mb4',
});

export default pool;
