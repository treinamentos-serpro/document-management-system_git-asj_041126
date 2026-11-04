import DownloadButton from './DownloadButton.jsx';
import DeleteButton from './DeleteButton.jsx';
import { formatFileSize } from '../utils/formatFileSize.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({
  actionError,
  deleteError,
  documents,
  error,
  isLoading,
  onDelete,
  onDownload,
  onRefresh,
}) {
  return (
    <>
      <div className="library-heading">
        <div>
          <p className="eyebrow">ACERVO</p>
          <h2 id="library-title">Todos os documentos</h2>
        </div>
        <button
          aria-label="Atualizar lista de documentos"
          className="icon-button"
          disabled={isLoading}
          onClick={onRefresh}
          title="Atualizar"
          type="button"
        >
          <span aria-hidden="true">↻</span>
        </button>
      </div>

      {actionError && <p className="feedback feedback-error list-feedback" role="alert">{actionError}</p>}
      {deleteError && <p className="feedback feedback-error list-feedback" role="alert">{deleteError}</p>}
      {error && <p className="feedback feedback-error list-feedback" role="alert">{error}</p>}

      {isLoading ? (
        <div className="list-state" role="status">Carregando documentos…</div>
      ) : documents.length === 0 ? (
        <div className="list-state empty-state">
          <span className="empty-mark" aria-hidden="true">—</span>
          <span>Nenhum documento</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="document-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Adicionado</th>
                <th scope="col"><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((documentItem) => (
                <tr key={documentItem.id}>
                  <td className="document-name-cell">
                    <span className="document-mark" aria-hidden="true">DOC</span>
                    <span className="document-name" title={documentItem.originalName}>
                      {documentItem.originalName}
                    </span>
                  </td>
                  <td className="metadata-cell">{formatFileSize(documentItem.size)}</td>
                  <td className="metadata-cell">{formatDate(documentItem.uploadedAt)}</td>
                  <td className="action-cell">
                    <DownloadButton documentItem={documentItem} onDownload={onDownload} />
                    <DeleteButton documentItem={documentItem} onDelete={onDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}