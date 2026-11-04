import { useCallback, useEffect, useState } from 'react';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentsApi.js';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setListError('');

    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setListError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  async function handleUpload(file) {
    setIsUploading(true);
    setUploadError('');
    setUploadNotice('');

    try {
      const newDocument = await uploadDocument(file);
      setDocuments((currentDocuments) => [newDocument, ...currentDocuments]);
      setUploadNotice('Documento enviado.');
      return true;
    } catch (error) {
      setUploadError(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(documentItem) {
    setDownloadError('');

    try {
      return await downloadDocument(documentItem.id);
    } catch (error) {
      setDownloadError(error.message);
      return null;
    }
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="brand" href="/" aria-label="Biblioteca de documentos">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>ARQUIVO<span className="brand-period">.</span></span>
        </a>
        <div className="service-status">
          <span className="status-dot" aria-hidden="true" />
          <span>Acervo local</span>
        </div>
      </header>

      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">DOCUMENTOS</p>
            <h1>Biblioteca</h1>
          </div>
          <div className="document-count" aria-live="polite">
            <span className="count-number">{documents.length.toString().padStart(2, '0')}</span>
            <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </div>

        <div className="workspace">
          <aside className="upload-column">
            <UploadComponent
              error={uploadError}
              isUploading={isUploading}
              notice={uploadNotice}
              onUpload={handleUpload}
            />
          </aside>

          <section className="library-column" aria-labelledby="library-title">
            <DocumentList
              actionError={downloadError}
              documents={documents}
              error={listError}
              isLoading={isLoading}
              onDownload={handleDownload}
              onRefresh={refreshDocuments}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
