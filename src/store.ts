import { CVData } from './types';
import { defaultCVData } from './data';
import { migrateLevel } from './i18n/translations';
import { saveToFirestore, loadFromFirestore } from './lib/firestore';

const STORAGE_KEY = 'professional-cv-data';
const DATA_VERSION = 2; // bump when defaultCVData changes significantly

function migrateLanguageLevels(data: CVData): CVData {
  return {
    ...data,
    languages: data.languages.map(lang => ({
      ...lang,
      level: migrateLevel(lang.level),
    })),
  };
}

export function loadCVData(): CVData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // If stored data is from an older version, fall back to fresh defaults
      if (!parsed._version || parsed._version < DATA_VERSION) {
        return { ...defaultCVData };
      }
      const data: CVData = {
        personalInfo: { ...defaultCVData.personalInfo, ...parsed.personalInfo },
        experiences: parsed.experiences || defaultCVData.experiences,
        skills: parsed.skills || defaultCVData.skills,
        languages: parsed.languages || defaultCVData.languages,
        certificates: parsed.certificates || defaultCVData.certificates,
      };
      return migrateLanguageLevels(data);
    }
  } catch (e) {
    console.error('Error loading CV data:', e);
  }
  return { ...defaultCVData };
}

export function saveCVData(data: CVData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, _version: DATA_VERSION }));
  } catch (e) {
    console.error('Error saving CV data:', e);
  }
}

// Save locally + sync to Firebase
export async function saveCVDataWithSync(data: CVData): Promise<void> {
  saveCVData(data);
  // Non-blocking Firebase sync
  saveToFirestore(data).catch(e => console.error('Firebase sync failed:', e));
}

// Load from Firebase first, fallback to local
export async function loadCVDataWithSync(): Promise<CVData> {
  const localData = loadCVData();
  try {
    const remoteData = await loadFromFirestore();
    if (remoteData) {
      // Save remote data locally as cache
      saveCVData(remoteData);
      return remoteData;
    }
  } catch (e) {
    console.error('Firebase load failed, using local:', e);
  }
  return localData;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[+]?[\d\s-]{8,15}$/.test(phone);
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}
