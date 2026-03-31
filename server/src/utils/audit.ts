import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';

export interface AuditContext {
  userId: string;
  userName: string;
}

export async function auditLog(
  action: string,
  context: AuditContext,
  details: string
): Promise<void> {
  try {
    await getDb().query(
      `INSERT INTO audit_log (id, action, user_id, user_name, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), action, context.userId, context.userName, details, new Date().toISOString()]
    );
  } catch {
    // Fire-and-forget — don't break the request on audit failure
  }
}
