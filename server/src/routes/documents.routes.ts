import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { getDb } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

interface DocumentRow {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  case_id: string;
  uploaded_by: string;
  uploaded_at: string;
  version: number;
}

function toDocumentResponse(row: DocumentRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    url: row.url,
    caseId: row.case_id,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    version: row.version,
  };
}

// GET /documents
router.get('/', authenticate, (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const caseId = req.query.caseId as string | undefined;

  let whereClause = '';
  const params: unknown[] = [];

  if (caseId) {
    whereClause = 'WHERE case_id = ?';
    params.push(caseId);
  }

  const countRow = getDb().prepare(`SELECT COUNT(*) as count FROM documents ${whereClause}`).get(...params) as { count: number };
  const rows = getDb().prepare(`SELECT * FROM documents ${whereClause} ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as DocumentRow[];

  paginatedResponse(res, rows.map(toDocumentResponse), countRow.count, page, pageSize);
});

// POST /documents/upload
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    apiError(res, 'No file provided');
    return;
  }

  const caseId = req.body.caseId;
  if (!caseId) {
    apiError(res, 'caseId is required');
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const fileName = req.body.fileName || req.file.originalname;

  getDb().prepare(`
    INSERT INTO documents (id, file_name, file_size, file_type, url, case_id, uploaded_by, uploaded_at, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, fileName, req.file.size, req.file.mimetype, req.file.filename, caseId, req.user!.id, now);

  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRow;
  apiResponse(res, toDocumentResponse(row), 201);
});

// GET /documents/:id
router.get('/:id', authenticate, (req, res) => {
  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocumentRow | undefined;
  if (!row) {
    apiError(res, 'Document not found', 404);
    return;
  }
  apiResponse(res, toDocumentResponse(row));
});

// GET /documents/:id/download
router.get('/:id/download', authenticate, (req, res) => {
  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocumentRow | undefined;
  if (!row) {
    apiError(res, 'Document not found', 404);
    return;
  }

  const filePath = path.join(config.uploadDir, row.url);
  if (!fs.existsSync(filePath)) {
    apiError(res, 'File not found on disk', 404);
    return;
  }

  res.setHeader('Content-Disposition', `attachment; filename="${row.file_name}"`);
  res.setHeader('Content-Type', row.file_type || 'application/octet-stream');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// DELETE /documents/:id
router.delete('/:id', authenticate, (req, res) => {
  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocumentRow | undefined;
  if (!row) {
    apiError(res, 'Document not found', 404);
    return;
  }

  // Delete file from disk
  const filePath = path.join(config.uploadDir, row.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  getDb().prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  apiResponse(res, null);
});

export { router as documentsRoutes };
