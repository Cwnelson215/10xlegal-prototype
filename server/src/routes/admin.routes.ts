import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import { getDb } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { normalizeAttorneyName } from '../utils/nameFormat.js';
import { auditLog } from '../utils/audit.js';

const router = Router();

// Admin-only middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    apiError(res, 'Admin access required', 403);
    return;
  }
  next();
}

router.use(authenticate, requireAdmin);

// ─── GET /admin/stats ────────────────────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  const db = getDb();

  const [cases, users, attorneys, firms, deadlines, casesByStatus, usersByRole] = await Promise.all([
    db.query('SELECT COUNT(*)::int as count FROM cases'),
    db.query('SELECT COUNT(*)::int as count FROM users'),
    db.query('SELECT COUNT(*)::int as count FROM attorneys'),
    db.query('SELECT COUNT(*)::int as count FROM law_firms'),
    db.query('SELECT COUNT(*)::int as count FROM deadlines'),
    db.query('SELECT status, COUNT(*)::int as count FROM cases GROUP BY status'),
    db.query('SELECT role, COUNT(*)::int as count FROM users GROUP BY role'),
  ]);

  const caseStatusMap: Record<string, number> = {};
  for (const row of casesByStatus.rows) {
    caseStatusMap[row.status] = row.count;
  }

  const roleMap: Record<string, number> = {};
  for (const row of usersByRole.rows) {
    roleMap[row.role] = row.count;
  }

  apiResponse(res, {
    totalCases: cases.rows[0]!.count,
    totalUsers: users.rows[0]!.count,
    totalAttorneys: attorneys.rows[0]!.count,
    totalFirms: firms.rows[0]!.count,
    totalDeadlines: deadlines.rows[0]!.count,
    casesByStatus: caseStatusMap,
    usersByRole: roleMap,
  });
});

// ─── GET /admin/users ────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

function toUserResponse(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/users', async (req, res) => {
  const db = getDb();
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;

  const [countResult, dataResult] = await Promise.all([
    db.query('SELECT COUNT(*)::int as count FROM users'),
    db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [pageSize, offset]),
  ]);

  const total = countResult.rows[0]!.count;
  const users = (dataResult.rows as UserRow[]).map(toUserResponse);
  paginatedResponse(res, users, total, page, pageSize);
});

// ─── PATCH /admin/users/:id/role ─────────────────────────────────────────────

router.patch('/users/:id/role', async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { role, adminPassword } = req.body;

  const validRoles = ['client', 'lawyer', 'legal-official', 'admin'];
  if (!role || !validRoles.includes(role)) {
    apiError(res, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    return;
  }

  // Upgrading to admin requires admin password verification
  if (role === 'admin') {
    if (!adminPassword) {
      apiError(res, 'Admin password is required to grant admin privileges', 400);
      return;
    }

    const adminResult = await db.query(
      'SELECT admin_password FROM users WHERE id = $1',
      [req.user!.id]
    );
    const storedHash = adminResult.rows[0]?.admin_password;

    if (!storedHash) {
      apiError(res, 'Admin password not set. Please set an admin password first.', 400);
      return;
    }

    if (!bcryptjs.compareSync(adminPassword, storedHash)) {
      apiError(res, 'Incorrect admin password', 401);
      return;
    }
  }

  const now = new Date().toISOString();
  const result = await db.query(
    'UPDATE users SET role = $1, updated_at = $2 WHERE id = $3 RETURNING *',
    [role, now, id]
  );

  if (result.rows.length === 0) {
    apiError(res, 'User not found', 404);
    return;
  }

  auditLog('role_change', { userId: req.user!.id, userName: req.user!.name }, `Changed user ${id} role to ${role}`);

  apiResponse(res, toUserResponse(result.rows[0] as UserRow));
});

// ─── GET /admin/has-admin-password ──────────────────────────────────────────

router.get('/has-admin-password', async (req, res) => {
  const db = getDb();
  const result = await db.query(
    'SELECT admin_password FROM users WHERE id = $1',
    [req.user!.id]
  );
  apiResponse(res, { hasAdminPassword: !!result.rows[0]?.admin_password });
});

// ─── POST /admin/admin-password ─────────────────────────────────────────────

router.post('/admin-password', async (req, res) => {
  const db = getDb();
  const { password } = req.body;

  if (!password || typeof password !== 'string' || password.length < 8) {
    apiError(res, 'Admin password must be at least 8 characters', 400);
    return;
  }

  const hashed = bcryptjs.hashSync(password, 10);
  const now = new Date().toISOString();

  await db.query(
    'UPDATE users SET admin_password = $1, updated_at = $2 WHERE id = $3',
    [hashed, now, req.user!.id]
  );

  auditLog('admin_password_set', { userId: req.user!.id, userName: req.user!.name }, 'Admin password was set/updated');

  apiResponse(res, { message: 'Admin password set successfully' });
});

// ─── POST /admin/upload ──────────────────────────────────────────────────────

router.post('/upload', async (req, res) => {
  const { sheets } = req.body;
  const db = getDb();
  const now = new Date().toISOString();
  const importId = uuidv4();

  if (!sheets || typeof sheets !== 'object') {
    apiError(res, 'sheets object is required');
    return;
  }

  const validTypes = ['cases', 'deadlines', 'users', 'attorneys', 'firms'];
  let totalImported = 0;
  let totalFailed = 0;
  const allErrors: { row: number; field: string; message: string }[] = [];
  const results: { dataType: string; totalRows: number; importedRows: number; failedRows: number; errors: { row: number; field: string; message: string }[] }[] = [];

  for (const [dataType, data] of Object.entries(sheets)) {
    if (!validTypes.includes(dataType) || !Array.isArray(data)) continue;

    let importedRows = 0;
    let failedRows = 0;
    const errors: { row: number; field: string; message: string }[] = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        switch (dataType) {
          case 'cases': {
            // Batch cases in groups of 100
            const batch: any[] = [row];
            while (i + 1 < data.length && batch.length < 100) {
              i++;
              batch.push(data[i]);
            }
            try {
              const placeholders: string[] = [];
              const values: any[] = [];
              for (let b = 0; b < batch.length; b++) {
                const r = batch[b];
                const offset = b * 27;
                placeholders.push(`(${Array.from({ length: 27 }, (_, k) => `$${offset + k + 1}`).join(',')})`);
                const prosName = normalizeAttorneyName(r.prosecutionAttorney || r.prosecution_attorney || '');
                const defName = normalizeAttorneyName(r.defenseAttorney || r.defense_attorney || '');
                values.push(
                  uuidv4(), r.title || `${r.charge || 'Case'} - ${r.caseNumber || r.case_number || ''}`,
                  r.description || '', r.status || 'active',
                  r.caseNumber || r.case_number || '', r.clientId || r.client_id || '',
                  r.court || '', prosName,
                  defName,
                  r.prosecutionFirm || r.prosecution_firm || '',
                  r.defenseFirm || r.defense_firm || '',
                  r.charge || '', r.courtDate || r.court_date || '',
                  r.ruling || '', r.sentence || '',
                  r.convictionOutcome || r.conviction_outcome || '',
                  r.convictionDate || r.conviction_date || '',
                  r.districtNumber || r.district_number || '',
                  r.filingDate || r.filing_date || '',
                  r.dispositionDate || r.disposition_date || '',
                  r.caseType || r.case_type || '',
                  r.offenseCode || r.offense_code || '',
                  r.sentenceDate || r.sentence_date || '',
                  r.charges ? (Array.isArray(r.charges) ? JSON.stringify(r.charges) : r.charges) : '',
                  r.judgmentDescription || r.judgment_description || '',
                  r.sentenceDescription || r.sentence_description || '',
                  now,
                );
              }
              await db.query(
                `INSERT INTO cases (id, title, description, status, case_number, client_id, court,
                  prosecution_attorney, defense_attorney, prosecution_firm, defense_firm,
                  charge, court_date, ruling, sentence, conviction_outcome, conviction_date,
                  district_number, filing_date, disposition_date,
                  case_type, offense_code, sentence_date, charges,
                  judgment_description, sentence_description,
                  updated_at)
                 VALUES ${placeholders.join(',')}
                 ON CONFLICT (case_number) DO UPDATE SET
                  title = CASE WHEN cases.title = '' THEN EXCLUDED.title ELSE cases.title END,
                  description = CASE WHEN cases.description = '' THEN EXCLUDED.description ELSE cases.description END,
                  status = CASE WHEN cases.status = 'active' THEN EXCLUDED.status ELSE cases.status END,
                  client_id = CASE WHEN cases.client_id = '' THEN EXCLUDED.client_id ELSE cases.client_id END,
                  court = CASE WHEN cases.court = '' THEN EXCLUDED.court ELSE cases.court END,
                  prosecution_attorney = CASE
                    WHEN cases.prosecution_attorney = '' THEN EXCLUDED.prosecution_attorney
                    WHEN EXCLUDED.prosecution_attorney = '' THEN cases.prosecution_attorney
                    WHEN cases.prosecution_attorney LIKE '%' || EXCLUDED.prosecution_attorney || '%' THEN cases.prosecution_attorney
                    ELSE cases.prosecution_attorney || '; ' || EXCLUDED.prosecution_attorney
                  END,
                  defense_attorney = CASE
                    WHEN cases.defense_attorney = '' THEN EXCLUDED.defense_attorney
                    WHEN EXCLUDED.defense_attorney = '' THEN cases.defense_attorney
                    WHEN cases.defense_attorney LIKE '%' || EXCLUDED.defense_attorney || '%' THEN cases.defense_attorney
                    ELSE cases.defense_attorney || '; ' || EXCLUDED.defense_attorney
                  END,
                  prosecution_firm = CASE WHEN cases.prosecution_firm = '' THEN EXCLUDED.prosecution_firm ELSE cases.prosecution_firm END,
                  defense_firm = CASE WHEN cases.defense_firm = '' THEN EXCLUDED.defense_firm ELSE cases.defense_firm END,
                  charge = CASE WHEN cases.charge = '' THEN EXCLUDED.charge ELSE cases.charge END,
                  court_date = CASE WHEN cases.court_date = '' THEN EXCLUDED.court_date ELSE cases.court_date END,
                  ruling = CASE WHEN cases.ruling = '' THEN EXCLUDED.ruling ELSE cases.ruling END,
                  sentence = CASE WHEN cases.sentence = '' THEN EXCLUDED.sentence ELSE cases.sentence END,
                  conviction_outcome = CASE WHEN cases.conviction_outcome = '' THEN EXCLUDED.conviction_outcome ELSE cases.conviction_outcome END,
                  conviction_date = CASE WHEN cases.conviction_date = '' THEN EXCLUDED.conviction_date ELSE cases.conviction_date END,
                  district_number = CASE WHEN cases.district_number = '' THEN EXCLUDED.district_number ELSE cases.district_number END,
                  filing_date = CASE WHEN cases.filing_date = '' THEN EXCLUDED.filing_date ELSE cases.filing_date END,
                  disposition_date = CASE WHEN cases.disposition_date = '' THEN EXCLUDED.disposition_date ELSE cases.disposition_date END,
                  case_type = CASE WHEN cases.case_type = '' THEN EXCLUDED.case_type ELSE cases.case_type END,
                  offense_code = CASE WHEN cases.offense_code = '' THEN EXCLUDED.offense_code ELSE cases.offense_code END,
                  sentence_date = CASE WHEN cases.sentence_date = '' THEN EXCLUDED.sentence_date ELSE cases.sentence_date END,
                  charges = CASE WHEN cases.charges = '' THEN EXCLUDED.charges ELSE cases.charges END,
                  judgment_description = CASE WHEN cases.judgment_description = '' THEN EXCLUDED.judgment_description ELSE cases.judgment_description END,
                  sentence_description = CASE WHEN cases.sentence_description = '' THEN EXCLUDED.sentence_description ELSE cases.sentence_description END,
                  updated_at = EXCLUDED.updated_at`,
                values
              );
              importedRows += batch.length;

              // Auto-create attorney records and link them to cases
              for (const r of batch) {
                const caseNum = r.caseNumber || r.case_number || '';
                if (!caseNum) continue;
                const prosAtty = normalizeAttorneyName(r.prosecutionAttorney || r.prosecution_attorney || '');
                const defAtty = normalizeAttorneyName(r.defenseAttorney || r.defense_attorney || '');

                if (prosAtty) {
                  const attResult = await db.query(
                    `INSERT INTO attorneys (id, name, type, created_at, updated_at)
                     VALUES ($1, $2, 'prosecution', $3, $3)
                     ON CONFLICT (name, type) DO UPDATE SET updated_at = $3
                     RETURNING id`,
                    [uuidv4(), prosAtty, now]
                  );
                  const attId = attResult.rows[0]?.id;
                  if (attId) {
                    await db.query(
                      `UPDATE cases SET prosecution_attorney_id = $1 WHERE case_number = $2`,
                      [attId, caseNum]
                    );
                  }
                }
                if (defAtty) {
                  const attResult = await db.query(
                    `INSERT INTO attorneys (id, name, type, created_at, updated_at)
                     VALUES ($1, $2, 'defense', $3, $3)
                     ON CONFLICT (name, type) DO UPDATE SET updated_at = $3
                     RETURNING id`,
                    [uuidv4(), defAtty, now]
                  );
                  const attId = attResult.rows[0]?.id;
                  if (attId) {
                    await db.query(
                      `UPDATE cases SET defense_attorney_id = $1 WHERE case_number = $2`,
                      [attId, caseNum]
                    );
                  }
                }
              }
            } catch (_batchErr) {
              // Fallback: insert row-by-row on batch failure
              for (let b = 0; b < batch.length; b++) {
                try {
                  const r = batch[b];
                  await db.query(
                    `INSERT INTO cases (id, title, description, status, case_number, client_id, court,
                      prosecution_attorney, defense_attorney, prosecution_firm, defense_firm,
                      charge, court_date, ruling, sentence, conviction_outcome, conviction_date,
                      district_number, filing_date, disposition_date,
                      case_type, offense_code, sentence_date, charges,
                      judgment_description, sentence_description,
                      updated_at)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
                     ON CONFLICT (case_number) DO UPDATE SET
                      title = CASE WHEN cases.title = '' THEN EXCLUDED.title ELSE cases.title END,
                      description = CASE WHEN cases.description = '' THEN EXCLUDED.description ELSE cases.description END,
                      status = CASE WHEN cases.status = 'active' THEN EXCLUDED.status ELSE cases.status END,
                      client_id = CASE WHEN cases.client_id = '' THEN EXCLUDED.client_id ELSE cases.client_id END,
                      court = CASE WHEN cases.court = '' THEN EXCLUDED.court ELSE cases.court END,
                      prosecution_attorney = CASE
                        WHEN cases.prosecution_attorney = '' THEN EXCLUDED.prosecution_attorney
                        WHEN EXCLUDED.prosecution_attorney = '' THEN cases.prosecution_attorney
                        WHEN cases.prosecution_attorney LIKE '%' || EXCLUDED.prosecution_attorney || '%' THEN cases.prosecution_attorney
                        ELSE cases.prosecution_attorney || '; ' || EXCLUDED.prosecution_attorney
                      END,
                      defense_attorney = CASE
                        WHEN cases.defense_attorney = '' THEN EXCLUDED.defense_attorney
                        WHEN EXCLUDED.defense_attorney = '' THEN cases.defense_attorney
                        WHEN cases.defense_attorney LIKE '%' || EXCLUDED.defense_attorney || '%' THEN cases.defense_attorney
                        ELSE cases.defense_attorney || '; ' || EXCLUDED.defense_attorney
                      END,
                      prosecution_firm = CASE WHEN cases.prosecution_firm = '' THEN EXCLUDED.prosecution_firm ELSE cases.prosecution_firm END,
                      defense_firm = CASE WHEN cases.defense_firm = '' THEN EXCLUDED.defense_firm ELSE cases.defense_firm END,
                      charge = CASE WHEN cases.charge = '' THEN EXCLUDED.charge ELSE cases.charge END,
                      court_date = CASE WHEN cases.court_date = '' THEN EXCLUDED.court_date ELSE cases.court_date END,
                      ruling = CASE WHEN cases.ruling = '' THEN EXCLUDED.ruling ELSE cases.ruling END,
                      sentence = CASE WHEN cases.sentence = '' THEN EXCLUDED.sentence ELSE cases.sentence END,
                      conviction_outcome = CASE WHEN cases.conviction_outcome = '' THEN EXCLUDED.conviction_outcome ELSE cases.conviction_outcome END,
                      conviction_date = CASE WHEN cases.conviction_date = '' THEN EXCLUDED.conviction_date ELSE cases.conviction_date END,
                      district_number = CASE WHEN cases.district_number = '' THEN EXCLUDED.district_number ELSE cases.district_number END,
                      filing_date = CASE WHEN cases.filing_date = '' THEN EXCLUDED.filing_date ELSE cases.filing_date END,
                      disposition_date = CASE WHEN cases.disposition_date = '' THEN EXCLUDED.disposition_date ELSE cases.disposition_date END,
                      case_type = CASE WHEN cases.case_type = '' THEN EXCLUDED.case_type ELSE cases.case_type END,
                      offense_code = CASE WHEN cases.offense_code = '' THEN EXCLUDED.offense_code ELSE cases.offense_code END,
                      sentence_date = CASE WHEN cases.sentence_date = '' THEN EXCLUDED.sentence_date ELSE cases.sentence_date END,
                      charges = CASE WHEN cases.charges = '' THEN EXCLUDED.charges ELSE cases.charges END,
                      judgment_description = CASE WHEN cases.judgment_description = '' THEN EXCLUDED.judgment_description ELSE cases.judgment_description END,
                      sentence_description = CASE WHEN cases.sentence_description = '' THEN EXCLUDED.sentence_description ELSE cases.sentence_description END,
                      updated_at = EXCLUDED.updated_at`,
                    [
                      uuidv4(), r.title || `${r.charge || 'Case'} - ${r.caseNumber || r.case_number || ''}`,
                      r.description || '', r.status || 'active',
                      r.caseNumber || r.case_number || '', r.clientId || r.client_id || '',
                      r.court || '', normalizeAttorneyName(r.prosecutionAttorney || r.prosecution_attorney || ''),
                      normalizeAttorneyName(r.defenseAttorney || r.defense_attorney || ''),
                      r.prosecutionFirm || r.prosecution_firm || '',
                      r.defenseFirm || r.defense_firm || '',
                      r.charge || '', r.courtDate || r.court_date || '',
                      r.ruling || '', r.sentence || '',
                      r.convictionOutcome || r.conviction_outcome || '',
                      r.convictionDate || r.conviction_date || '',
                      r.districtNumber || r.district_number || '',
                      r.filingDate || r.filing_date || '',
                      r.dispositionDate || r.disposition_date || '',
                      r.caseType || r.case_type || '',
                      r.offenseCode || r.offense_code || '',
                      r.sentenceDate || r.sentence_date || '',
                      r.charges ? (Array.isArray(r.charges) ? JSON.stringify(r.charges) : r.charges) : '',
                      r.judgmentDescription || r.judgment_description || '',
                      r.sentenceDescription || r.sentence_description || '',
                      now,
                    ]
                  );

                  // Auto-create attorney records and link to case
                  const fbCaseNum = r.caseNumber || r.case_number || '';
                  const fbPros = normalizeAttorneyName(r.prosecutionAttorney || r.prosecution_attorney || '');
                  const fbDef = normalizeAttorneyName(r.defenseAttorney || r.defense_attorney || '');
                  if (fbCaseNum && fbPros) {
                    const ar = await db.query(
                      `INSERT INTO attorneys (id, name, type, created_at, updated_at)
                       VALUES ($1, $2, 'prosecution', $3, $3)
                       ON CONFLICT (name, type) DO UPDATE SET updated_at = $3
                       RETURNING id`,
                      [uuidv4(), fbPros, now]
                    );
                    if (ar.rows[0]?.id) {
                      await db.query(`UPDATE cases SET prosecution_attorney_id = $1 WHERE case_number = $2`, [ar.rows[0].id, fbCaseNum]);
                    }
                  }
                  if (fbCaseNum && fbDef) {
                    const ar = await db.query(
                      `INSERT INTO attorneys (id, name, type, created_at, updated_at)
                       VALUES ($1, $2, 'defense', $3, $3)
                       ON CONFLICT (name, type) DO UPDATE SET updated_at = $3
                       RETURNING id`,
                      [uuidv4(), fbDef, now]
                    );
                    if (ar.rows[0]?.id) {
                      await db.query(`UPDATE cases SET defense_attorney_id = $1 WHERE case_number = $2`, [ar.rows[0].id, fbCaseNum]);
                    }
                  }

                  importedRows++;
                } catch (rowErr) {
                  failedRows++;
                  errors.push({ row: i - batch.length + b + 2, field: dataType, message: rowErr instanceof Error ? rowErr.message : 'Insert failed' });
                }
              }
            }
            break;
          }
          case 'deadlines':
            await db.query(
              `INSERT INTO deadlines (id, title, description, due_date, case_id, case_number, assigned_to, status, client_id, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
              [
                uuidv4(), row.title || '', row.description || '',
                row.dueDate || row.due_date || '', row.caseId || row.case_id || '',
                row.caseNumber || row.case_number || '', row.assignedTo || row.assigned_to || '',
                row.status || 'pending', row.clientId || row.client_id || '',
                now, now,
              ]
            );
            importedRows++;
            break;
          case 'users':
            await db.query(
              `INSERT INTO users (id, name, email, password, role, verification_status, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
               ON CONFLICT (email) DO NOTHING`,
              [
                uuidv4(), row.name || '', row.email || '',
                row.password || 'changeme', row.role || 'client',
                row.verificationStatus || row.verification_status || 'pending',
                now, now,
              ]
            );
            importedRows++;
            break;
          case 'attorneys':
            await db.query(
              `INSERT INTO attorneys (id, name, type, firm_id, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT (name, type) DO UPDATE SET
                 firm_id = COALESCE(EXCLUDED.firm_id, attorneys.firm_id),
                 updated_at = EXCLUDED.updated_at`,
              [
                uuidv4(), normalizeAttorneyName(row.name || ''),
                row.type || 'defense', row.firmId || row.firm_id || null,
                now, now,
              ]
            );
            importedRows++;
            break;
          case 'firms':
            await db.query(
              `INSERT INTO law_firms (id, name, type, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5)
               ON CONFLICT (name) DO NOTHING`,
              [
                uuidv4(), row.name || '',
                row.type || '', now, now,
              ]
            );
            importedRows++;
            break;
        }
      } catch (err) {
        failedRows++;
        errors.push({ row: i + 1, field: dataType, message: err instanceof Error ? err.message : 'Insert failed' });
      }
    }

    totalImported += importedRows;
    totalFailed += failedRows;
    allErrors.push(...errors);
    results.push({ dataType, totalRows: data.length, importedRows, failedRows, errors });

    // Record import history per data type
    try {
      const status = failedRows === 0 ? 'completed' : importedRows > 0 ? 'partial' : 'failed';
      await db.query(
        `INSERT INTO import_history (id, data_type, format, file_name, total_rows, imported_rows, failed_rows, status, errors, imported_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [uuidv4(), dataType, req.body.format || 'xlsx', req.body.fileName || 'upload',
          data.length, importedRows, failedRows, status, JSON.stringify(errors), req.user!.id, now]
      );
    } catch (_logErr) {
      // Don't fail the response if logging fails
    }
  }

  const typeSummary = results.map(r => `${r.importedRows} ${r.dataType}`).join(', ');
  auditLog('data_import', { userId: req.user!.id, userName: req.user!.name }, `Imported ${typeSummary} (${totalFailed} total failed)`);

  const totalRows = results.reduce((sum, r) => sum + r.totalRows, 0);

  apiResponse(res, {
    importId,
    format: req.body.format || 'xlsx',
    totalRows,
    importedRows: totalImported,
    failedRows: totalFailed,
    errors: allErrors,
    results,
    createdAt: now,
  });
});

// ─── GET /admin/imports ──────────────────────────────────────────────────────

router.get('/imports', async (req, res) => {
  const db = getDb();
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;

  const [countResult, dataResult] = await Promise.all([
    db.query('SELECT COUNT(*)::int as count FROM import_history'),
    db.query('SELECT * FROM import_history ORDER BY created_at DESC LIMIT $1 OFFSET $2', [pageSize, offset]),
  ]);

  const total = countResult.rows[0]!.count;
  const records = dataResult.rows.map((row: any) => ({
    id: row.id,
    dataType: row.data_type,
    format: row.format,
    fileName: row.file_name,
    totalRows: row.total_rows,
    importedRows: row.imported_rows,
    failedRows: row.failed_rows,
    status: row.status,
    errors: JSON.parse(row.errors || '[]'),
    importedBy: row.imported_by,
    createdAt: row.created_at,
  }));

  paginatedResponse(res, records, total, page, pageSize);
});

// ─── GET /admin/export ───────────────────────────────────────────────────────

router.get('/export', async (req, res) => {
  const db = getDb();
  const { dataType, format } = req.query as Record<string, string>;

  let query: string;
  switch (dataType) {
    case 'cases': query = 'SELECT * FROM cases ORDER BY created_at DESC'; break;
    case 'deadlines': query = 'SELECT * FROM deadlines ORDER BY created_at DESC'; break;
    case 'users': query = 'SELECT id, name, email, role, verification_status, created_at FROM users ORDER BY created_at DESC'; break;
    case 'attorneys': query = 'SELECT * FROM attorneys ORDER BY created_at DESC'; break;
    case 'firms': query = 'SELECT * FROM law_firms ORDER BY created_at DESC'; break;
    default:
      apiError(res, 'Invalid dataType');
      return;
  }

  const result = await db.query(query);

  if (format === 'csv') {
    if (result.rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataType}.csv"`);
      res.send('');
      return;
    }
    const headers = Object.keys(result.rows[0]!);
    const csvRows = [
      headers.join(','),
      ...result.rows.map((row: any) =>
        headers.map(h => {
          let val = String(row[h] ?? '');
          // Prevent CSV formula injection
          if (/^[=+\-@\t\r]/.test(val)) {
            val = "'" + val;
          }
          return val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        }).join(',')
      ),
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dataType}.csv"`);
    res.send(csvRows.join('\n'));
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${dataType}.json"`);
    res.json(result.rows);
  }
});

// ─── GET /admin/audit-log ────────────────────────────────────────────────────

router.get('/audit-log', async (req, res) => {
  const db = getDb();
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;

  const [countResult, dataResult] = await Promise.all([
    db.query('SELECT COUNT(*)::int as count FROM audit_log'),
    db.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2', [pageSize, offset]),
  ]);

  const total = countResult.rows[0]!.count;
  const entries = dataResult.rows.map((row: any) => ({
    id: row.id,
    action: row.action,
    userId: row.user_id,
    userName: row.user_name,
    details: row.details,
    createdAt: row.created_at,
  }));

  paginatedResponse(res, entries, total, page, pageSize);
});

// ─── POST /admin/truncate ───────────────────────────────────────────────────

router.post('/truncate', async (req, res) => {
  const db = getDb();
  const logger = (req as any).log ?? console;

  try {
    logger.info({ userId: req.user?.id }, 'Admin initiated data truncation');

    await db.query(
      'TRUNCATE TABLE documents, deadlines, cases, attorneys, law_firms, import_history, audit_log CASCADE'
    );

    const tablesCleared = ['documents', 'deadlines', 'cases', 'attorneys', 'law_firms', 'import_history', 'audit_log'];

    apiResponse(res, {
      message: 'All data tables truncated successfully',
      tablesCleared,
      truncatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'Failed to truncate data');
    apiError(res, 'Failed to truncate data', 500);
  }
});

export { router as adminRoutes };
