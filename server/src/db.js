import mysql from 'mysql2/promise';
import 'dotenv/config';

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};
const base = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || 'floodguard_isef',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

// MariaDB (XAMPP) returns JSON columns as text; parse them here.
const JSON_COLS = ['payload', 'inputs', 'breakdown', 'recommendations'];
const fix = (row) => {
  for (const k of JSON_COLS) {
    if (typeof row[k] === 'string') { try { row[k] = JSON.parse(row[k]); } catch { /* keep text */ } }
  }
  return row;
};
export const pool = {
  async query(sql, params) {
    const [rows, fields] = await base.query(sql, params);
    if (Array.isArray(rows)) rows.forEach((r) => r && typeof r === 'object' && fix(r));
    return [rows, fields];
  },
};