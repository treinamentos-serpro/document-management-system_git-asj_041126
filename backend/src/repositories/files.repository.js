const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/dms.config');

function createFilesRepository() {
  function getFilePath(id) {
    return path.join(storageDirectory, id);
  }

  return {
    getFilePath,

    async fileExists(id) {
      try {
        await fs.access(getFilePath(id));
        return true;
      } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
      }
    },

    async remove(id) {
      try {
        await fs.unlink(getFilePath(id));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    },
  };
}

module.exports = { createFilesRepository };