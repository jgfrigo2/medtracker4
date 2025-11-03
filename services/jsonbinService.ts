import type { AppState } from '../types';

const API_BASE_URL = 'https://api.jsonbin.io/v3/b';

export const getBinData = async (apiKey: string, binId: string): Promise<AppState> => {
  const response = await fetch(`${API_BASE_URL}/${binId}/latest`, {
    method: 'GET',
    headers: {
      'X-Master-Key': apiKey,
      'X-Bin-Versioning': 'false',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al obtener los datos de JSONbin.');
  }
  // The free tier of jsonbin wraps the response in a "record" object
  const data = await response.json();
  return data.record || data;
};

export const updateBinData = async (apiKey: string, binId: string, data: AppState): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey,
      'X-Bin-Versioning': 'false',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al guardar los datos en JSONbin.');
  }
};
