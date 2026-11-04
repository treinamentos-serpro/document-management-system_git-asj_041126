const { defaultOwner } = require('../config/dms.config');

function createServiceError(statusCode, code, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = statusCode;
  error.publicCode = code;
  error.publicMessage = message;
  return error;
}

function createDocumentsService({ documentsRepository, filesRepository }) {
  return {
    async registerUpload(file) {
      if (file.size === 0) {
        try {
          await filesRepository.remove(file.filename);
        } catch (error) {
          throw createServiceError(
            500,
            'STORAGE_ERROR',
            'Não foi possível limpar o arquivo vazio.',
            error,
          );
        }
        throw createServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
      }

      const document = {
        id: file.filename,
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner: defaultOwner,
      };

      try {
        return documentsRepository.add(document);
      } catch (error) {
        try {
          await filesRepository.remove(document.id);
        } catch (cleanupError) {
          error.cleanupError = cleanupError;
        }
        throw createServiceError(
          500,
          'STORAGE_ERROR',
          'Não foi possível registrar o documento.',
          error,
        );
      }
    },

    listDocuments() {
      return documentsRepository.findAll();
    },

    async deleteDocument(id) {
      const document = documentsRepository.findById(id);
      if (!document) {
        throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      try {
        await filesRepository.remove(document.id);
      } catch (error) {
        throw createServiceError(
          500,
          'STORAGE_ERROR',
          'Não foi possível excluir o documento.',
          error,
        );
      }

      documentsRepository.remove(document.id);
    },

    async getDocumentDownload(id) {
      const document = documentsRepository.findById(id);
      if (!document) {
        throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      let fileExists;
      try {
        fileExists = await filesRepository.fileExists(document.id);
      } catch (error) {
        throw createServiceError(
          500,
          'STORAGE_ERROR',
          'Não foi possível acessar o documento.',
          error,
        );
      }

      if (!fileExists) {
        throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return { document, filePath: filesRepository.getFilePath(document.id) };
    },
  };
}

module.exports = { createDocumentsService };