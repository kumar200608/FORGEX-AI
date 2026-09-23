/**
 * Send a success response
 * @param {Response} res 
 * @param {any} data 
 * @param {number} statusCode 
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Send an error response
 * @param {Response} res 
 * @param {string} error 
 * @param {number} statusCode 
 */
const sendError = (res, error = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error
  });
};

module.exports = {
  sendSuccess,
  sendError
};
