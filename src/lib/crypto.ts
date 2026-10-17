import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'nexus-ai-chat-2024-secure-key';

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function hashString(str: string): string {
  return CryptoJS.SHA256(str).toString();
}
