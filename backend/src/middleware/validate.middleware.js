const { sendError } = require('../utils/response.util');

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    return sendError(res, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: error.errors
    }, 400);
  }
};

module.exports = { validate };
