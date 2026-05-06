const crypto = require('crypto');

// Encryption key - should be in environment variables
const SECRET = process.env.ENCRYPTION_KEY || 'talentflow-secure-encryption-key-2026';
const ALGORITHM = 'aes-256-gcm';

// Derive a 32-byte key from the secret
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET).digest();

class EncryptionService {
  static encrypt(text) {
    if (!text) return text;

    try {
      const iv = crypto.randomBytes(12); // Standard for GCM
      const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      // Return format: iv:authTag:encryptedData
      return iv.toString('hex') + ':' + authTag + ':' + encrypted;
    } catch (error) {
      console.error('Encryption failed:', error.message);
      return text;
    }
  }

  static decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText;

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return encryptedText; // Return original if decryption fails
    }
  }

  // Hash sensitive data (one-way)
  static hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

module.exports = EncryptionService;