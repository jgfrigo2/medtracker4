
import React, { useState } from 'react';
import type { AppState, StandardMedPattern, JsonBinCredential, HealthRecord } from '../types';
import { getBinData, updateBinData } from '../services/jsonbinService';
import { TIME_SLOTS } from '../constants';

// --- SVGs ---
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;

interface SettingsProps {
  appState: AppState;
  onUpdateMedicationList: (list: string[]) => void;
  onUpdateStandardMedPattern: (pattern: StandardMedPattern) => void;
  onUpdateJsonBinCredentials: (credentials: JsonBinCredential[]) => void;
  onSetState: (newState: AppState) => void;
}

const Settings: React.FC<SettingsProps> = ({
  appState,
  onUpdateMedicationList,
  onUpdateStandardMedPattern,
  onUpdateJsonBinCredentials,
  onSetState,
}) => {
  const [newMed, setNewMed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPattern, setTempPattern] = useState<StandardMedPattern>(appState.standardMedPattern);
  const [showCredForm, setShowCredForm] = useState(false);
  const [currentCred, setCurrentCred] = useState<Partial<JsonBinCredential>>({});

  // Medication List Handlers
  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMed && !appState.medicationList.includes(newMed)) {
      onUpdateMedicationList([...appState.medicationList, newMed]);
      setNewMed('');
    }
  };

  const handleDeleteMed = (medToDelete: string) => {
    onUpdateMedicationList(appState.medicationList.filter(med => med !== medToDelete));
  };
  
  // Standard Pattern Handlers
  const handlePatternChange = (time: string, selectedOptions: HTMLCollection) => {
    const values = Array.from(selectedOptions).map((option: any) => option.value);
    setTempPattern(prev => ({ ...prev, [time]: values }));
  };

  const handleSavePattern = () => {
    onUpdateStandardMedPattern(tempPattern);
    alert('Patrón estándar guardado.');
  };

  // Data Management Handlers
  const handleDownload = () => {
    const dataStr = JSON.stringify(appState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const newState = JSON.parse(result);
            if (window.confirm('¿Estás seguro de que quieres sobreescribir todos tus datos con este archivo?')) {
              onSetState(newState);
              alert('Datos cargados correctamente.');
            }
          }
        } catch (err) {
          alert('Error al leer el archivo. Asegúrate de que es un JSON válido.');
        }
      };
      reader.readAsText(file);
    }
  };
  
  // JSONbin Handlers
  const handleJsonBinAction = async (action: 'load' | 'save', cred: JsonBinCredential) => {
    setLoading(true);
    setError('');
    try {
        if (action === 'load') {
            if (!window.confirm(`¿Seguro que quieres sobreescribir tus datos con los de "${cred.name}"?`)) {
              setLoading(false);
              return;
            }
            const data = await getBinData(cred.apiKey, cred.binId);
            onSetState(data);
            alert(`Datos cargados desde "${cred.name}" correctamente.`);
        } else {
            await updateBinData(cred.apiKey, cred.binId, appState);
            alert(`Datos guardados en "${cred.name}" correctamente.`);
        }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveCred = () => {
    if (!currentCred.name || !currentCred.apiKey || !currentCred.binId) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    const existing = appState.jsonBinCredentials.find(c => c.id === currentCred.id);
    if (existing) {
      onUpdateJsonBinCredentials(appState.jsonBinCredentials.map(c => c.id === currentCred.id ? (currentCred as JsonBinCredential) : c));
    } else {
      onUpdateJsonBinCredentials([...appState.jsonBinCredentials, { ...currentCred, id: new Date().toISOString() } as JsonBinCredential]);
    }
    setCurrentCred({});
    setShowCredForm(false);
  };
  
  const handleDeleteCred = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar estas credenciales?')) {
      onUpdateJsonBinCredentials(appState.jsonBinCredentials.filter(c => c.id !== id));
    }
  };

  const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-8">
      <Section title="Lista de Medicamentos">
        <form onSubmit={handleAddMed} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newMed}
            onChange={(e) => setNewMed(e.target.value)}
            placeholder="Añadir nuevo medicamento"
            className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
            <PlusIcon /> Añadir
          </button>
        </form>
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {appState.medicationList.map(med => (
            <li key={med} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-md">
              <span>{med}</span>
              <button onClick={() => handleDeleteMed(med)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Patrón de Medicación Estándar">
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {TIME_SLOTS.map(time => (
                <div key={time} className="grid grid-cols-3 gap-4 items-center">
                    <label className="font-medium text-right">{time}</label>
                    <div className="col-span-2">
                        <select
                            multiple
                            value={tempPattern[time] || []}
                            onChange={e => handlePatternChange(time, e.target.selectedOptions)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 h-20"
                        >
                            {appState.medicationList.map(med => <option key={med} value={med}>{med}</option>)}
                        </select>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-4 text-right">
            <button onClick={handleSavePattern} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 ml-auto">
                <SaveIcon /> Guardar Patrón
            </button>
        </div>
      </Section>

      <Section title="Gestión de Datos">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Fichero Local</h4>
            <div className="flex flex-col gap-2">
              <button onClick={handleDownload} className="w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Descargar Datos (JSON)</button>
              <label className="w-full text-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer">
                Cargar Datos (JSON)
                <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Sincronización con JSONbin.io</h4>
            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md mb-2">{error}</p>}
            <div className="space-y-2">
                {appState.jsonBinCredentials.map(cred => (
                    <div key={cred.id} className="p-2 bg-white dark:bg-gray-800 rounded-md flex justify-between items-center">
                        <span className="font-medium">{cred.name}</span>
                        <div className="flex gap-2">
                            <button onClick={() => handleJsonBinAction('load', cred)} disabled={loading} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">Cargar</button>
                            <button onClick={() => handleJsonBinAction('save', cred)} disabled={loading} className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">Guardar</button>
                            <button onClick={() => handleDeleteCred(cred.id)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
            {!showCredForm && (
                <button onClick={() => { setShowCredForm(true); setCurrentCred({}); }} className="mt-2 w-full text-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">Añadir Credenciales</button>
            )}
            {showCredForm && (
                <div className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <h5 className="font-semibold mb-2">Nuevas Credenciales</h5>
                    <div className="space-y-2">
                        <input type="text" placeholder="Nombre (ej. Mi PC)" value={currentCred.name || ''} onChange={e => setCurrentCred(c => ({...c, name: e.target.value}))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="password" placeholder="X-Master-Key" value={currentCred.apiKey || ''} onChange={e => setCurrentCred(c => ({...c, apiKey: e.target.value}))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        <input type="text" placeholder="Bin ID" value={currentCred.binId || ''} onChange={e => setCurrentCred(c => ({...c, binId: e.target.value}))} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button onClick={handleSaveCred} className="px-3 py-1 bg-blue-600 text-white rounded">Guardar</button>
                        <button onClick={() => setShowCredForm(false)} className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-black dark:text-white rounded">Cancelar</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default Settings;
