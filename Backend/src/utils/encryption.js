const crypto = require('crypto');

// ⚠️ ต้องไปตั้งค่า ENCRYPTION_SECRET ในไฟล์ .env ของ Backend ให้มีความยาวเป๊ะๆ 32 ตัวอักษร
// ตัวอย่าง: ENCRYPTION_SECRET="my-super-secret-key-must-be-32-b!"
const SECRET_KEY = process.env.ENCRYPTION_SECRET; 
const ALGORITHM = 'aes-256-gcm';

// ฟังก์ชันสำหรับเข้ารหัส (ก่อนเซฟลง Database)
exports.encrypt = (text) => {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16); // สุ่มค่า IV ใหม่ทุกครั้งที่เข้ารหัส
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedKey: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
};

// ฟังก์ชันสำหรับถอดรหัส (ตอนจะดึงไปใช้งานยิงหา AI)
exports.decrypt = (encryptedKey, ivHex, authTagHex) => {
  if (!encryptedKey || !ivHex || !authTagHex) return null;

  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(SECRET_KEY), 
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};