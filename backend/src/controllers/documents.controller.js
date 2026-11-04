const { createReadStream } = require('node:fs');

function createDocumentsController({ documentsService }) {
  return {
    async upload(req, res, next) {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
        });
      }

      try {
        const document = await documentsService.registerUpload(req.file);
        return res.status(201)
          .location(`/documents/${document.id}/download`)
          .json(document);
      } catch (error) {
        return next(error);
      }
    },

    list(req, res, next) {
      try {
        return res.status(200).json(documentsService.listDocuments());
      } catch (error) {
        return next(error);
      }
    },

    async remove(req, res, next) {
      try {
        await documentsService.deleteDocument(req.params.id);
        return res.status(204).end();
      } catch (error) {
        return next(error);
      }
    },

    async download(req, res, next) {
      try {
        const { document, filePath } = await documentsService.getDocumentDownload(req.params.id);
        const fileStream = createReadStream(filePath);

        fileStream.once('error', (error) => {
          if (res.headersSent) return res.destroy(error);
          return next(error);
        });

        fileStream.once('open', () => {
          res.attachment(document.originalName);
          res.type('application/octet-stream');
          fileStream.pipe(res);
        });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createDocumentsController };