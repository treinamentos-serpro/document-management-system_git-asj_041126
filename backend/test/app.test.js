const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('node:http');
const { access, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const storageDirectory = path.join(os.tmpdir(), `dms-test-${randomUUID()}`);
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_UPLOAD_SIZE_MB = '0.0001';
process.env.DMS_DEFAULT_OWNER = 'test-user';

const app = require('../src/app');
let server;
let baseUrl;

before(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await rm(storageDirectory, { recursive: true, force: true });
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'teste.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  assert.strictEqual(document.originalName, 'teste.txt');
  assert.strictEqual(document.size, 17);
  assert.strictEqual(document.owner, 'test-user');
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  assert.deepStrictEqual(await listResponse.json(), [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /filename="teste\.txt"/);
  assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');

  const deleteResponse = await fetch(`${baseUrl}/documents/${document.id}`, { method: 'DELETE' });
  assert.strictEqual(deleteResponse.status, 204);
  assert.strictEqual(await deleteResponse.text(), '');
  await assert.rejects(access(path.join(storageDirectory, document.id)), { code: 'ENOENT' });

  const listAfterDeleteResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listAfterDeleteResponse.status, 200);
  assert.deepStrictEqual(await listAfterDeleteResponse.json(), []);
});

test('retorna erros consistentes para arquivo ausente e documento inexistente', async () => {
  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: new FormData() });
  assert.strictEqual(uploadResponse.status, 400);
  assert.deepStrictEqual(await uploadResponse.json(), {
    error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
  });

  const emptyForm = new FormData();
  emptyForm.append('file', new Blob([]), 'vazio.txt');
  const emptyResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: emptyForm });
  assert.strictEqual(emptyResponse.status, 400);
  assert.deepStrictEqual(await emptyResponse.json(), {
    error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
  });

  const downloadResponse = await fetch(`${baseUrl}/documents/${randomUUID()}/download`);
  assert.strictEqual(downloadResponse.status, 404);
  assert.deepStrictEqual(await downloadResponse.json(), {
    error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
  });

  const deleteResponse = await fetch(`${baseUrl}/documents/${randomUUID()}`, { method: 'DELETE' });
  assert.strictEqual(deleteResponse.status, 404);
  assert.deepStrictEqual(await deleteResponse.json(), {
    error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
  });

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob([Buffer.alloc(105)]), 'grande.bin');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: oversizedForm,
  });

  assert.strictEqual(oversizedResponse.status, 413);
  assert.deepStrictEqual(await oversizedResponse.json(), {
    error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o limite permitido.' },
  });
});
