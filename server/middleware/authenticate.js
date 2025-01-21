const { expressjwt: jwt } = require('express-jwt');
const dotenv = require('dotenv');
dotenv.config();

// Middleware to protect routes
const authenticate = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256']
});

module.exports = authenticate;