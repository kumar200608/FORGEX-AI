const { sendError } = require('../utils/response.util');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // We should never leak sensitive details in error responses.
  // Especially not plaintext notes or cryptographic keys (though we don't have those).
  sendError(res, 'Internal Server Error', 500);
};

module.exports = errorHandler;
