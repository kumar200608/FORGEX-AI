const { sendSuccess } = require('../utils/response.util');

const getStatus = (req, res) => {
  return sendSuccess(res, {
    e2ee: true,
    encryptedNoteStorage: true,
    blindIndexSearch: true,
    encryptedKeySharing: true,
    accessRevocation: true,
    keyRotation: true
  });
};

module.exports = { getStatus };
