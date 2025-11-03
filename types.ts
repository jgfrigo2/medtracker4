
export interface HealthRecord {
  time: string;
  value: number | null;
  medication: string[];
  comments: string;
}

export interface DailyData {
  date: string;
  records: HealthRecord[];
}

export interface StandardMedPattern {
  [time: string]: string[];
}

export interface JsonBinCredential {
  id: string;
  name: string;
  apiKey: string;
  binId: string;
}

export interface AppState {
  allData: Record<string, DailyData>;
  medicationList: string[];
  standardMedPattern: StandardMedPattern;
  jsonBinCredentials: JsonBinCredential[];
}

export type AppAction =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'SAVE_DAY'; payload: DailyData }
  | { type: 'UPDATE_MEDICATION_LIST'; payload: string[] }
  | { type: 'UPDATE_STANDARD_MED_PATTERN'; payload: StandardMedPattern }
  | { type: 'UPDATE_JSONBIN_CREDENTIALS'; payload: JsonBinCredential[] };
