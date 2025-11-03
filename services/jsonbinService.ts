import type { AppState } from '../types';

const API_BASE_URL = 'https://api.jsonbin.io/v3/b';

export const getBinData = async (apiKey: string, binId: string): Promise<AppState> => {
  const response = await fetch(`${API_BASE_URL}/${binId}/latest`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Master-Key': apiKey,
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
      'Accept': 'application/json',
      'X-Master-Key': apiKey,
      // FIX: Add 'X-Bin-Versioning': 'false' to prevent CORS preflight errors
      // on PUT requests from the browser. JSONbin.io's versioning feature
      // can cause issues with CORS.
      'X-Bin-Versioning': 'false',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al guardar los datos en JSONbin.');
  }
};
