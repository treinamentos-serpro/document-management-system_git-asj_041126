import { useState } from 'react';

export default function DownloadButton({ documentItem, onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);

    try {
      const blob = await onDownload(documentItem);
      if (!blob) return;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = documentItem.originalName || 'documento';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      aria-label={`Baixar ${documentItem.originalName}`}
      className="button button-download"
      disabled={isDownloading}
      onClick={handleDownload}
      title={`Baixar ${documentItem.originalName}`}
      type="button"
    >
      <span aria-hidden="true">↓</span>
      {isDownloading ? 'Baixando' : 'Baixar'}
    </button>
  );
}