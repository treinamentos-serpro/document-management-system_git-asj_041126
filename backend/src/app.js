// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const { createDocumentsController } = require('./controllers/documents.controller');
const { errorMiddleware } = require('./middlewares/error.middleware');
const { createDocumentsRepository } = require('./repositories/documents.repository');
const { createFilesRepository } = require('./repositories/files.repository');
const { createDocumentsRouter } = require('./routes/documents.routes');
const { createDocumentsService } = require('./services/documents.service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const documentsRepository = createDocumentsRepository();
const filesRepository = createFilesRepository();
const documentsService = createDocumentsService({ documentsRepository, filesRepository });
const documentsController = createDocumentsController({ documentsService });

app.use(createDocumentsRouter({ documentsController }));
app.use(errorMiddleware);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
