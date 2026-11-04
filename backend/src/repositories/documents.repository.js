function createDocumentsRepository() {
  const documentsById = new Map();

  return {
    add(document) {
      documentsById.set(document.id, document);
      return document;
    },

    findAll() {
      return [...documentsById.values()].sort((first, second) => {
        const dateDifference = Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt);
        return dateDifference || first.id.localeCompare(second.id);
      });
    },

    findById(id) {
      return documentsById.get(id) || null;
    },
  };
}

module.exports = { createDocumentsRepository };