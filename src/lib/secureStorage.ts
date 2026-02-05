/**
 * Secure Storage Module
 * 
 * Encrypts sensitive data (API keys) before storing in localStorage
 * using the Web Crypto API (AES-GCM).
 * 
 * Security Note: The encryption key is derived from a device fingerprint.
 * This protects against:
 * - Casual inspection via DevTools
 * - Most browser extensions
 * - Exported/copied localStorage data
 * 
 * For maximum security, consider adding a user-provided master password.
 */

const STORAGE_PREFIX = "secure_";
const KEY_NAME = "jules_api_key";

/**
 * Generate a device-specific fingerprint for key derivation
 * Combines immutable browser characteristics
 */
async function getDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth.toString(),
    screen.width.toString() + "x" + screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    // Add more stable components as needed
  ];
  
  // Create deterministic fingerprint
  const fingerprintStr = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintStr);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive an AES-GCM encryption key from the device fingerprint
 */
async function deriveKey(): Promise<CryptoKey> {
  const fingerprint = await getDeviceFingerprint();
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(fingerprint);
  
  // Import as raw key material
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  // Derive actual encryption key
  // Using a fixed salt (not ideal, but acceptable for device-bound keys)
  const salt = encoder.encode("jules-turbo-v1");
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext data
 */
async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await deriveKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    
    // Combine IV + ciphertext for storage
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Base64 encode for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt encrypted data
 */
async function decrypt(encrypted: string): Promise<string> {
  try {
    const key = await deriveKey();
    
    // Base64 decode
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data - key may have changed or data corrupted");
  }
}

/**
 * Securely store API key (encrypted)
 */
export async function setSecureApiKey(apiKey: string): Promise<void> {
  const encrypted = await encrypt(apiKey);
  localStorage.setItem(STORAGE_PREFIX + KEY_NAME, encrypted);
  
  // Remove any legacy plaintext key
  const legacyKey = localStorage.getItem(KEY_NAME);
  if (legacyKey && !legacyKey.startsWith(STORAGE_PREFIX)) {
    localStorage.removeItem(KEY_NAME);
  }
}

/**
 * Retrieve and decrypt API key
 */
export async function getSecureApiKey(): Promise<string | null> {
  // Try secure storage first
  const encrypted = localStorage.getItem(STORAGE_PREFIX + KEY_NAME);
  if (encrypted) {
    try {
      return await decrypt(encrypted);
    } catch (error) {
      console.warn("Failed to decrypt API key, removing corrupted data");
      localStorage.removeItem(STORAGE_PREFIX + KEY_NAME);
      return null;
    }
  }
  
  // Migration: Check for legacy plaintext key
  const legacyKey = localStorage.getItem(KEY_NAME);
  if (legacyKey) {
    console.info("Migrating plaintext API key to encrypted storage");
    try {
      await setSecureApiKey(legacyKey);
      localStorage.removeItem(KEY_NAME);
      return legacyKey;
    } catch (error) {
      console.error("Migration failed:", error);
      // Return the plaintext key but don't remove it yet
      return legacyKey;
    }
  }
  
  return null;
}

/**
 * Remove API key from storage
 */
export function removeSecureApiKey(): void {
  localStorage.removeItem(STORAGE_PREFIX + KEY_NAME);
  localStorage.removeItem(KEY_NAME); // Also remove legacy
}

/**
 * Check if Web Crypto API is available
 */
export function isSecureStorageAvailable(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.encrypt === "function"
  );
}
