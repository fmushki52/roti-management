import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../../../drizzle/schema';

function getDb() {
  const url = process.env.TURSO_DATABASE_URL || 'libsql://localhost';
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

export const db = getDb();
export type DB = typeof db;
