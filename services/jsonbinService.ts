import type { AppState } from '../types';

export const getBinData = async (apiKey: string, binId: string): Promise<AppState> => {
  // Route the request through our Netlify function to avoid CORS issues and hide keys.
  const response = await fetch(`/.netlify/functions/get-bin-data?apiKey=${encodeURIComponent(apiKey)}&binId=${encodeURIComponent(binId)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al obtener los datos desde el servidor.');
  }

  // The free tier of jsonbin wraps the response in a "record" object.
  const data = await response.json();
  return data.record || data;
};

export const updateBinData = async (apiKey: string, binId: string, data: AppState): Promise<void> => {
  // Route the request through our Netlify function. We use POST.
  const response = await fetch(`/.netlify/functions/update-bin-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, binId, data }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al guardar los datos en el servidor.');
  }
};
