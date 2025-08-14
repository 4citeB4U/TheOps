import { exportAllData, db } from './db';
import CUE from './cueRuntime';

// --- Encryption Helpers (using Web Crypto API) ---

// Derives a key from a password using PBKDF2
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Encrypts data using AES-GCM
async function encryptData(data: string, password: string): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey(password, salt);
    const enc = new TextEncoder();
    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        enc.encode(data)
    );
    const encryptedArr = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(salt.length + iv.length + encryptedArr.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedArr, salt.length + iv.length);

    // Return as base64 string
    return btoa(String.fromCharCode.apply(null, combined as any));
}

// --- Backup Handlers ---

export const handleDownloadBackup = async () => {
  CUE.tts.speak("Prepping your unencrypted data for download.");
  try {
    const dataStr = await exportAllData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lex_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    localStorage.setItem('lexLastBackupTimestamp', new Date().toISOString());
  } catch (error) {
    console.error("Failed to create download backup:", error);
    CUE.tts.speak("Sorry, I couldn't prepare the data download.");
  }
};

export const handleEncryptedExport = async () => {
    const password = prompt("Please enter a password to encrypt your backup. Remember this password, it's not recoverable.");
    if (!password) {
        CUE.tts.speak("Backup canceled.");
        return;
    }
    CUE.tts.speak("Encrypting your data. This might take a moment.");
    try {
        const dataStr = await exportAllData();
        const encryptedData = await encryptData(dataStr, password);
        
        const dataBlob = new Blob([encryptedData], { type: 'text/plain' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lex_encrypted_backup_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        localStorage.setItem('lexLastBackupTimestamp', new Date().toISOString());
        CUE.tts.speak("Your encrypted backup has been downloaded.");
    } catch(e) {
        console.error("Encryption failed:", e);
        CUE.tts.speak("I'm sorry, the encryption process failed. Please check the console for details.");
    }
}

export const handleEncryptedImport = async () => {
    alert("Encrypted import is not yet implemented in this version.");
    // This would be the reverse of the export:
    // 1. Ask for file and password
    // 2. Read file as text
    // 3. Decode base64, extract salt, iv, and content
    // 4. Derive key from password and salt
    // 5. Decrypt content with key and iv
    // 6. Parse decrypted JSON
    // 7. Clear all tables and bulk-add new data
}

export const handleEmailBackup = async () => {
  CUE.tts.speak("Opening your email client. Download your data to attach it.");
  try {
    const subject = `LΞX Ops Center Backup - ${new Date().toLocaleDateString()}`;
    const body = `Hello,

This email is for your LΞX Ops Center data backup.

To attach your data:
1. Go back to The Garage in the LΞX app.
2. Click "Download Unencrypted JSON".
3. Attach the downloaded file to this email and send it.

Regards,
Your LΞX Co-Pilot`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
  } catch (error) {
    console.error("Failed to create email backup link:", error);
    CUE.tts.speak("Sorry, I couldn't open your email client.");
  }
};