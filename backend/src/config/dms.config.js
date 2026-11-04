const path = require('node:path');

const configuredMaxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 10);

if (!Number.isFinite(configuredMaxUploadSizeMb) || configuredMaxUploadSizeMb <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_MB deve ser um número positivo.');
}

const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(__dirname, '../../storage');

module.exports = {
  defaultOwner: process.env.DMS_DEFAULT_OWNER || 'local',
  maxUploadSizeBytes: Math.floor(configuredMaxUploadSizeMb * 1024 * 1024),
  storageDirectory,
};