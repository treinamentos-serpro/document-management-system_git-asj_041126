import { useRef, useState } from 'react';
import { formatFileSize } from '../utils/formatFileSize.js';

export default function UploadComponent({ error, isUploading, notice, onUpload }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <form className="upload-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <span className="panel-index">01</span>
        <h2>Novo documento</h2>
      </div>

      <label className="field-label" htmlFor="document-file">Arquivo</label>
      <div className={`file-picker${selectedFile ? ' has-file' : ''}`}>
        <input
          ref={inputRef}
          className="visually-hidden"
          id="document-file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          type="file"
        />
        <label className="file-picker-label" htmlFor="document-file">
          <span className="picker-symbol" aria-hidden="true">＋</span>
          <span>{selectedFile ? 'Trocar arquivo' : 'Selecionar arquivo'}</span>
        </label>
        {selectedFile && (
          <div className="selected-file" title={selectedFile.name}>
            <span className="selected-file-name">{selectedFile.name}</span>
            <span className="selected-file-size">{formatFileSize(selectedFile.size)}</span>
          </div>
        )}
      </div>

      <button className="button button-primary upload-submit" disabled={!selectedFile || isUploading} type="submit">
        <span aria-hidden="true">{isUploading ? '…' : '↑'}</span>
        {isUploading ? 'Enviando' : 'Enviar documento'}
      </button>

      {error && <p className="feedback feedback-error" role="alert">{error}</p>}
      {notice && <p className="feedback feedback-success" role="status">{notice}</p>}
    </form>
  );
}