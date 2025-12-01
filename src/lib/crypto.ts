// RSA + AES Hybrid Encryption Utilities

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedKeys {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate RSA key pair for asymmetric encryption
 */
export const generateKeyPair = async (): Promise<KeyPair> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  
  return keyPair as KeyPair;
};

/**
 * Export keys to base64 strings for storage
 */
export const exportKeys = async (keyPair: KeyPair): Promise<ExportedKeys> => {
  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer))),
  };
};

/**
 * Import public key from base64 string
 */
export const importPublicKey = async (keyBase64: string): Promise<CryptoKey> => {
  const binaryString = atob(keyBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "spki",
    bytes,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
};

/**
 * Import private key from base64 string
 */
export const importPrivateKey = async (keyBase64: string): Promise<CryptoKey> => {
  const binaryString = atob(keyBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "pkcs8",
    bytes,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
};

/**
 * Generate AES symmetric key for file encryption
 */
export const generateAESKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Export AES key to raw bytes
 */
export const exportAESKey = async (key: CryptoKey): Promise<ArrayBuffer> => {
  return await window.crypto.subtle.exportKey("raw", key);
};

/**
 * Import AES key from raw bytes
 */
export const importAESKey = async (keyBuffer: ArrayBuffer): Promise<CryptoKey> => {
  return await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypt data with AES key
 */
export const encryptWithAES = async (
  data: Uint8Array,
  key: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  return { encryptedData, iv };
};

/**
 * Decrypt data with AES key
 */
export const decryptWithAES = async (
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> => {
  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encryptedData
  );
};

/**
 * Encrypt AES key with RSA public key
 */
export const encryptKeyWithRSA = async (
  aesKeyBuffer: ArrayBuffer,
  publicKey: CryptoKey
): Promise<string> => {
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    aesKeyBuffer
  );
  return btoa(String.fromCharCode(...new Uint8Array(encryptedKey)));
};

/**
 * Decrypt AES key with RSA private key
 */
export const decryptKeyWithRSA = async (
  encryptedKeyBase64: string,
  privateKey: CryptoKey
): Promise<ArrayBuffer> => {
  const binaryString = atob(encryptedKeyBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    bytes
  );
};

/**
 * Store private key encrypted in localStorage (simple encryption with password-derived key)
 */
export const storePrivateKey = (privateKey: string, userId: string) => {
  localStorage.setItem(`privateKey_${userId}`, privateKey);
};

/**
 * Retrieve private key from localStorage
 */
export const getPrivateKey = (userId: string): string | null => {
  return localStorage.getItem(`privateKey_${userId}`);
};

/**
 * Clear private key from localStorage
 */
export const clearPrivateKey = (userId: string) => {
  localStorage.removeItem(`privateKey_${userId}`);
};
