const prisma = require('../config/prisma');
const { encrypt } = require('../utils/encryption');

// AI Services
const geminiService = require('./ai/gemini');
const openaiService = require('./ai/openai');
const claudeService = require('./ai/claude');
const openrouterService = require('./ai/openrouter');
const intelsphereService = require('./ai/intelsphere');

exports.getUserSettings = async (userId) => {
  const setting = await prisma.userSetting.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { provider: true },
  });

  const configuredKeys = {
    gemini: keys.some(k => k.provider === 'gemini'),
    openai: keys.some(k => k.provider === 'openai'),
    claude: keys.some(k => k.provider === 'claude'),
    openrouter: keys.some(k => k.provider === 'openrouter'),
    intelsphere: keys.some(k => k.provider === 'intelsphere'),
  };

  return { setting, configuredKeys };
};

exports.updateUserSettings = async (userId, data) => {
  return await prisma.userSetting.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data
    },
  });
};

exports.saveProviderApiKey = async (userId, provider, apiKey) => {
  const encryptedData = encrypt(apiKey);

  if (!encryptedData) {
    throw new Error('กระบวนการเข้ารหัสล้มเหลว');
  }

  await prisma.apiKey.upsert({
    where: { userId_provider: { userId, provider } },
    update: {
      encryptedKey: encryptedData.encryptedKey,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
    },
    create: {
      userId,
      provider,
      encryptedKey: encryptedData.encryptedKey,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
    },
  });

  return `บันทึก API Key ของ ${provider} สำเร็จเรียบร้อย`;
};

exports.deleteProviderApiKey = async (userId, provider) => {
  await prisma.apiKey.delete({
    where: { userId_provider: { userId, provider } },
  });
  return `ลบ API Key ของ ${provider} สำเร็จ`;
};

exports.testProviderApiKey = async (provider, apiKey, modelName) => {
  if (provider === 'gemini') {
    await geminiService.testKey(apiKey, modelName);
  } else if (provider === 'openai') {
    await openaiService.testKey(apiKey, modelName);
  } else if (provider === 'claude') {
    await claudeService.testKey(apiKey, modelName);
  } else if (provider === 'openrouter') {
    await openrouterService.testKey(apiKey, modelName);
  } else if (provider === 'intelsphere') {
    await intelsphereService.testKey(apiKey, modelName);
  } else {
    throw new Error('ไม่รู้จัก Provider นี้');
  }
  return `✅ API Key ของ ${provider.toUpperCase()} ใช้งานได้ปกติ`;
};

exports.toggleAiStatus = async (userId, isAutoReplyActive) => {
  const setting = await prisma.userSetting.upsert({
    where: { userId },
    update: { isAutoReplyActive },
    create: { 
      userId,
      isAutoReplyActive 
    },
    select: { isAutoReplyActive: true }
  });
  return setting;
};

exports.checkUserHasAnyKey = async (userId) => {
  const count = await prisma.apiKey.count({
    where: { userId },
  });
  return count > 0;
};