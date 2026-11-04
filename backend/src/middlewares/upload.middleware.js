const { mkdir } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { maxUploadSizeBytes, storageDirectory } = require('../config/dms.config');

const diskStorage = multer.diskStorage({
  destination(req, file, callback) {
    mkdir(storageDirectory, { recursive: true })
      .then(() => callback(null, storageDirectory))
      .catch((error) => {
        error.statusCode = 500;
        error.publicCode = 'STORAGE_ERROR';
        error.publicMessage = 'Não foi possível preparar o armazenamento local.';
        callback(error);
      });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const multerUpload = multer({
  storage: diskStorage,
  limits: { fileSize: maxUploadSizeBytes, files: 1 },
}).single('file');

function uploadDocument(req, res, next) {
  multerUpload(req, res, (error) => {
    if (!error) return next();
    if (error.statusCode) return next(error);

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error.statusCode = 413;
        error.publicCode = 'FILE_TOO_LARGE';
        error.publicMessage = 'O arquivo excede o limite permitido.';
      } else {
        error.statusCode = 400;
        error.publicCode = 'FILE_REQUIRED';
        error.publicMessage = 'Envie um único arquivo no campo file.';
      }
      return next(error);
    }

    error.statusCode = 400;
    error.publicCode = 'INVALID_MULTIPART';
    error.publicMessage = 'A requisição multipart é inválida.';
    return next(error);
  });
}

module.exports = { uploadDocument };