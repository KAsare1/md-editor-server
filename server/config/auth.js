const jwt = require('jsonwebtoken');
dotenv = require('dotenv');
dotenv.config();


const generateToken = (user) => {
  const payload = {
    _id: user._id,  // Include the user ID in the JWT payload
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
};

module.exports = { generateToken };
