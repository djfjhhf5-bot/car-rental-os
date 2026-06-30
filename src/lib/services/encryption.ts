import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const PREFIX = "enc:";

function getKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return key;
}

export function encrypt(text: string): string {
  if (!text) return text;
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encoded: string): string {
  if (!encoded || !encoded.startsWith(PREFIX)) return encoded;
  const key = getKey();
  const parts = encoded.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return encoded;
  const [ivHex, authTagHex, encrypted] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
