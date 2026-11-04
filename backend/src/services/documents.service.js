const { defaultOwner } = require('../config/dms.config');

function createServiceError(statusCode, code, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = statusCode;
  error.publicCode = code;
  error.publicMessage = message;
  return error;
}

function createDocumentNotFoundError() {
  return createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
}

function createStorageError(message, cause) {
  return createServiceError(500, 'STORAGE_ERROR', message, cause);
}

function findDocumentOrThrow(documentsRepository, id) {
  const document = documentsRepository.findById(id);
  if (!document) throw createDocumentNotFoundError();
  return document;
}

async function removeFileOrThrow(filesRepository, id, message) {
  try {
    await filesRepository.remove(id);
  } catch (error) {
    throw createStorageError(message, error);
  }
}

async function cleanupFailedRegistration(filesRepository, id, originalError) {
  try {
    await filesRepository.remove(id);
  } catch (cleanupError) {
    originalError.cleanupError = cleanupError;
  }
}

function createDocumentsService({ documentsRepository, filesRepository }) {
  return {
    async registerUpload(file) {
      if (file.size === 0) {
        await removeFileOrThrow(
          filesRepository,
          file.filename,
          'Não foi possível limpar o arquivo vazio.',
        );
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
        await cleanupFailedRegistration(filesRepository, document.id, error);
        throw createStorageError(
          'Não foi possível registrar o documento.',
          error,
        );
      }
    },

    listDocuments() {
      return documentsRepository.findAll();
    },

    async deleteDocument(id) {
      const document = findDocumentOrThrow(documentsRepository, id);
      await removeFileOrThrow(
        filesRepository,
        document.id,
        'Não foi possível excluir o documento.',
      );
      documentsRepository.remove(document.id);
    },

    async getDocumentDownload(id) {
      const document = findDocumentOrThrow(documentsRepository, id);

      let fileExists;
      try {
        fileExists = await filesRepository.fileExists(document.id);
      } catch (error) {
        throw createStorageError(
          'Não foi possível acessar o documento.',
          error,
        );
      }

      if (!fileExists) throw createDocumentNotFoundError();

      return { document, filePath: filesRepository.getFilePath(document.id) };
    },
  };
}

module.exports = { createDocumentsService };