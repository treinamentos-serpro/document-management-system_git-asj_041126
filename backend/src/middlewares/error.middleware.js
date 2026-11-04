const multer = require('multer');

function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || 500;
  let code = error.publicCode || 'INTERNAL_ERROR';
  let message = error.publicMessage || 'Ocorreu um erro interno.';

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    code = 'FILE_TOO_LARGE';
    message = 'O arquivo excede o limite permitido.';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    code = 'DOCUMENT_NOT_FOUND';
    message = 'Documento não encontrado.';
  } else if (statusCode >= 500) {
    statusCode = 500;
    code = error.publicCode || 'INTERNAL_ERROR';
    message = error.publicMessage || 'Ocorreu um erro interno.';
  }

  return res.status(statusCode).json({ error: { code, message } });
}

module.exports = { errorMiddleware };