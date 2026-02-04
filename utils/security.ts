
import { UserProfile } from '../types';

export const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generar clave usando un Salt específico
const getCryptoKey = async (secret: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt, 
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptData = async (data: string, secret: string): Promise<string> => {
  try {
      // Generar Salt aleatorio (16 bytes) e IV aleatorio (12 bytes)
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const key = await getCryptoKey(secret, salt);
      const encodedData = new TextEncoder().encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData
      );

      const encryptedArray = new Uint8Array(encrypted);
      
      // Estructura: [Salt (16)] + [IV (12)] + [Data Enc]
      const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(encryptedArray, salt.length + iv.length);

      // Convertir a Base64
      let binary = '';
      const len = combined.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
  } catch (e) {
      console.error("Encryption failed", e);
      return "";
  }
};

export const decryptData = async (encoded: string, secret: string): Promise<string> => {
  try {
      const binary = atob(encoded);
      const len = binary.length;
      const combined = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        combined[i] = binary.charCodeAt(i);
      }

      // Extraer partes
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28); // 16 + 12
      const data = combined.slice(28);

      const key = await getCryptoKey(secret, salt);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
  } catch (e) {
      console.error("Decryption failed", e);
      // Intento de fallback para formato antiguo (si existiera)
      throw new Error("Invalid data");
  }
};

export const validateBackup = (data: any): boolean => {
  if (typeof data !== 'object' || data === null) return false;
  // Validación laxa inicial
  for (const key in data) {
    const user = data[key];
    if (!user.username || !user.settings || !user.logs) return false;
  }
  return true;
};
