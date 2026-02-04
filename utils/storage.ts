
import { UserProfile } from '../types';
import { encryptData, decryptData } from './security';

const DB_NAME = 'Horas2026_DB';
const STORE_NAME = 'users';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveDB = async (data: Record<string, UserProfile>, key: string): Promise<void> => {
  const db = await openDB();
  const encrypted = await encryptData(JSON.stringify(data), key);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(encrypted, 'main_db');
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadDB = async (key: string): Promise<Record<string, UserProfile> | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('main_db');
    
    request.onsuccess = async () => {
      const encrypted = request.result;
      if (!encrypted) {
        resolve(null);
        return;
      }
      try {
        const jsonStr = await decryptData(encrypted, key);
        const decrypted = JSON.parse(jsonStr);
        resolve(decrypted);
      } catch (e) {
        console.error("Error decrypting DB (AES)", e);
        // Fallback or Reset could go here
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};
