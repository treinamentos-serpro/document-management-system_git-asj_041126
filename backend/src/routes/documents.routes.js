const express = require('express');
const { uploadDocument } = require('../middlewares/upload.middleware');

function createDocumentsRouter({ documentsController }) {
  const router = express.Router();

  router.post('/upload', uploadDocument, documentsController.upload);
  router.get('/documents', documentsController.list);
  router.get('/documents/:id/download', documentsController.download);

  return router;
}

module.exports = { createDocumentsRouter };