const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../config/auth');

// User Registration
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Check for existing user by email and username
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 
          "Email already registered" : 
          "Username already taken" 
      });
    }

    // Create new user with plain password - model will handle hashing
    const newUser = new User({ 
      username: username.trim(),
      email: email.toLowerCase(),
      password // Plain password - will be hashed by the model's pre-save middleware
    });
    
    await newUser.save();

    // Don't send password back in response
    const userResponse = {
      username: newUser.username,
      email: newUser.email,
      id: newUser._id
    };

    res.status(201).json({ 
      message: "User created successfully", 
      user: userResponse 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: "Error creating user",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({ 
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error during login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};