import { useState } from 'react';

export default function DeleteButton({ documentItem, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Excluir "${documentItem.originalName}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(documentItem);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      aria-label={`Excluir ${documentItem.originalName}`}
      className="button button-delete"
      disabled={isDeleting}
      onClick={handleDelete}
      title={`Excluir ${documentItem.originalName}`}
      type="button"
    >
      <span aria-hidden="true">×</span>
      {isDeleting ? 'Excluindo' : 'Excluir'}
    </button>
  );
}