import { CVData, MediaFile } from '../types';
import { defaultCVData } from '../data';
import { migrateLevel } from '../i18n/translations';
import {
  doc, getDoc, setDoc, onSnapshot, Unsubscribe,
  collection, deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getStorageRef, isInitialized } from './firebase';

const MEDIA_COLLECTION = 'media_files';

const COLLECTION = 'cv_data';
const DOC_ID = 'main';

function migrateLanguageLevels(data: CVData): CVData {
  return { ...data, languages: data.languages.map(l => ({ ...l, level: migrateLevel(l.level) })) };
}

function mergeWithDefaults(raw: any): CVData {
  if (!raw) return { ...defaultCVData };
  return migrateLanguageLevels({
    personalInfo: { ...defaultCVData.personalInfo, ...(raw.personalInfo || {}) },
    experiences: raw.experiences || defaultCVData.experiences,
    skills: raw.skills || defaultCVData.skills,
    languages: raw.languages || defaultCVData.languages,
    certificates: raw.certificates || defaultCVData.certificates,
  });
}

export async function loadFromFirestore(): Promise<CVData | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (snap.exists()) {
      console.log('📥 Data loaded from Firestore');
      return mergeWithDefaults(snap.data());
    }
    console.log('📭 No Firestore data found');
    return null;
  } catch (e) {
    console.error('Firestore load error:', e);
    return null;
  }
}

export async function saveToFirestore(data: CVData): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    // Clean data for Firestore (remove undefined values)
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, COLLECTION, DOC_ID), cleanData, { merge: true });
    console.log('📤 Data saved to Firestore');
    return true;
  } catch (e) {
    console.error('Firestore save error:', e);
    return false;
  }
}

export function subscribeToFirestore(callback: (data: CVData) => void): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;
  return onSnapshot(doc(db, COLLECTION, DOC_ID), (snap) => {
    if (snap.exists()) {
      console.log('🔄 Real-time update from Firestore');
      callback(mergeWithDefaults(snap.data()));
    }
  }, (error) => {
    console.error('Firestore subscription error:', error);
  });
}

export async function uploadFile(file: File, path: string): Promise<string | null> {
  const st = getStorageRef();
  if (!st) return null;
  try {
    const fileRef = ref(st, path);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    console.log('📎 File uploaded:', path);
    return url;
  } catch (e) {
    console.error('Upload error:', e);
    return null;
  }
}

export async function uploadPhotoToStorage(base64DataUrl: string): Promise<string | null> {
  const st = getStorageRef();
  if (!st) return null;
  try {
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();
    const fileRef = ref(st, 'profile/photo.jpg');
    await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(fileRef);
    console.log('🖼️ Profile photo uploaded to Storage');
    return url;
  } catch (e) {
    console.error('Photo upload error:', e);
    return null;
  }
}

export async function saveFileMetadata(file: MediaFile): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, MEDIA_COLLECTION, file.id), file);
    return true;
  } catch (e) {
    console.error('Save file metadata error:', e);
    return false;
  }
}

export async function deleteFileMetadata(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, MEDIA_COLLECTION, id));
    return true;
  } catch (e) {
    console.error('Delete file metadata error:', e);
    return false;
  }
}

export function subscribeToFiles(callback: (files: MediaFile[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;
  return onSnapshot(collection(db, MEDIA_COLLECTION), (snap) => {
    const files = snap.docs.map(d => d.data() as MediaFile);
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    callback(files);
  }, (error) => {
    console.error('Files subscription error:', error);
  });
}

export function subscribeToTranslations(
  lang: string,
  onData: (labels: Record<string, string>) => void,
  onSeed: () => void,
): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;
  return onSnapshot(
    doc(db, 'translations', lang),
    snap => (snap.exists() ? onData(snap.data() as Record<string, string>) : onSeed()),
    error => console.error(`Translations sync error (${lang}):`, error),
  );
}

export async function saveTranslationDoc(lang: string, labels: Record<string, string>): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await setDoc(doc(db, 'translations', lang), labels);
    console.log(`📝 Translations seeded — ${lang}`);
  } catch (e) {
    console.warn(`Failed to seed translations — ${lang}:`, e);
  }
}

export async function deleteFromFirestore(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, COLLECTION, DOC_ID), {}, { merge: false });
    console.log('🗑️ Firestore data cleared');
    return true;
  } catch (e) {
    console.error('Firestore delete error:', e);
    return false;
  }
}
