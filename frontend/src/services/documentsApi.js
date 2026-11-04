const API_BASE_URL = '/api';

async function request(path, options) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(payload?.error?.message || 'Não foi possível concluir a solicitação.');
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}