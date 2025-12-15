const mongoose = require('mongoose');

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId in request parameters
 * @param {string} paramName - The name of the parameter to validate (default: 'id')
 * @returns {Function} - Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({ message: `${paramName} parameter is required` });
    }
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: `Invalid ${paramName} format` });
    }
    
    next();
  };
};

/**
 * Validates multiple ObjectIds in request parameters
 * @param {Array} paramNames - Array of parameter names to validate
 * @returns {Function} - Express middleware function
 */
const validateMultipleObjectIds = (paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      
      if (id && !isValidObjectId(id)) {
        return res.status(400).json({ message: `Invalid ${paramName} format` });
      }
    }
    
    next();
  };
};

module.exports = {
  isValidObjectId,
  validateObjectId,
  validateMultipleObjectIds
}; 