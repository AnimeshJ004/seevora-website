import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pool from '../config/db.js';

const originalQuery = pool.query;
const originalConnect = pool.connect;
const originalDocumentUploadDir = process.env.DOCUMENT_UPLOAD_DIR;

const tempResources = [];

async function makeTempUploadDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'seevora-uploads-'));
  tempResources.push(dir);
  return dir;
}

async function makeTempFile(name, content) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'seevora-upload-file-'));
  const filePath = path.join(dir, name);
  await fs.writeFile(filePath, content);
  tempResources.push(filePath, dir);
  return filePath;
}

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    set(headers) {
      Object.assign(this.headers, headers);
      return this;
    },
    download(filePath) {
      this.downloaded = filePath;
      return this;
    },
  };
}

afterEach(async () => {
  pool.query = originalQuery;
  pool.connect = originalConnect;
  process.env.DOCUMENT_UPLOAD_DIR = originalDocumentUploadDir;
  while (tempResources.length) {
    const resource = tempResources.pop();
    await fs.rm(resource, { recursive: true, force: true });
  }
});

describe('employee document upload security', () => {
  it('rejects disguised content before database insert', async () => {
    const uploadDir = await makeTempUploadDir();
    process.env.DOCUMENT_UPLOAD_DIR = uploadDir;
    const { default: employeeDocumentsRouter } = await import(`./employeeDocuments.js?reject=${Date.now()}`);
    const route = employeeDocumentsRouter.stack.find((layer) => layer.route?.path === '/documents/upload')?.route;
    assert.ok(route, 'upload route not found');

    const tempFile = await makeTempFile('aadhaar.pdf', Buffer.from('<html>not a pdf</html>'));
    let queryCalls = 0;
    pool.query = async () => {
      queryCalls += 1;
      return { rows: [{ id: 'emp-1' }], rowCount: 1 };
    };

    const response = makeResponse();
    const next = (err) => { throw err; };
    const handler = route.stack.at(-1).handle;

    await handler(
      {
        user: { id: 'user-1' },
        body: { docType: 'aadhaar' },
        file: {
          path: tempFile,
          originalname: 'aadhaar.pdf',
          mimetype: 'application/pdf',
          size: 22,
        },
      },
      response,
      next
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.message, 'Invalid or unsupported file content.');
    assert.equal(queryCalls, 1);
  });

  it('accepts valid pdf content and stores it under the private upload root', async () => {
    const uploadDir = await makeTempUploadDir();
    process.env.DOCUMENT_UPLOAD_DIR = uploadDir;
    const { default: employeeDocumentsRouter } = await import(`./employeeDocuments.js?accept=${Date.now()}`);
    const route = employeeDocumentsRouter.stack.find((layer) => layer.route?.path === '/documents/upload')?.route;
    assert.ok(route, 'upload route not found');

    const tempFile = await makeTempFile('aadhaar.pdf', Buffer.from('%PDF-1.7\nbody'));
    const calls = [];
    pool.query = async (sql) => {
      calls.push(sql);
      if (String(sql).includes('SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1')) {
        return { rows: [{ id: 'emp-1' }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    };
    pool.connect = async () => ({
      query: async (sql) => {
        calls.push(sql);
        if (String(sql).includes('SELECT id, file_path FROM employee_documents')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {},
    });

    const response = makeResponse();
    const next = (err) => { throw err; };
    const handler = route.stack.at(-1).handle;

    await handler(
      {
        user: { id: 'user-1' },
        body: { docType: 'aadhaar' },
        file: {
          path: tempFile,
          originalname: 'aadhaar.pdf',
          mimetype: 'application/pdf',
          size: 13,
        },
      },
      response,
      next
    );

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.docType, 'aadhaar');
    assert.ok(response.body.fileUrl);
    assert.ok(calls.some((sql) => String(sql).includes('INSERT INTO employee_documents')));
    const files = await fs.readdir(uploadDir);
    assert.equal(files.length, 1);
    assert.match(files[0], /\.pdf$/);
  });
});
