const User = require('../models/User');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (uid) => {
  return jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify email/password via Firebase Identity Toolkit REST API.
 * Requires FIREBASE_WEB_API_KEY in .env (from Firebase Console → Project settings).
 */
async function verifyPasswordWithFirebase(email, password) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey || apiKey === 'YOUR_FIREBASE_WEB_API_KEY') {
    // Fallback: only check that the user exists in Firebase Auth (less secure).
    // Prefer setting the real Web API key.
    console.warn(
      'FIREBASE_WEB_API_KEY not set – password is not verified. Set it in .env for secure login.'
    );
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord;
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const msg = data?.error?.message || 'Invalid credentials';
    if (msg.includes('INVALID_PASSWORD') || msg.includes('EMAIL_NOT_FOUND') || msg.includes('INVALID_LOGIN_CREDENTIALS')) {
      throw new Error('Invalid credentials');
    }
    throw new Error(msg);
  }

  // data.localId is the uid
  const userRecord = await admin.auth().getUser(data.localId);
  return userRecord;
}

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name } = req.body;

    const user = await User.create({ email, password, name });
    const token = generateToken(user.uid);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { uid: user.uid, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Registration error:', error);
    const message =
      error.code === 'auth/email-already-exists'
        ? 'User already exists'
        : error.message || 'Registration failed';
    res.status(400).json({
      success: false,
      message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Verify password (and existence) via Firebase
    let userRecord;
    try {
      userRecord = await verifyPasswordWithFirebase(email, password);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: authError.message || 'Invalid credentials',
      });
    }

    // Ensure Firestore profile exists
    let user = await User.findById(userRecord.uid);
    if (!user) {
      // Create missing profile (e.g. user created only in Auth)
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || email.split('@')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      user = {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || email.split('@')[0],
      };
    }

    const token = generateToken(userRecord.uid);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        uid: userRecord.uid,
        email: user.email || userRecord.email,
        name: user.name || userRecord.displayName || 'User',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      user: { uid: user.uid, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};
