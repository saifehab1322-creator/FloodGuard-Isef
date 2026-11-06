// Runs database/schema.sql and database/seed.sql (no mysql CLI needed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { dbConfig } from './db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'database');
const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
for (const f of ['schema.sql', 'seed.sql']) {
  await conn.query(fs.readFileSync(path.join(dir, f), 'utf8'));
  console.log('OK', f);
}
await conn.end();
