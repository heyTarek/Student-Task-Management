const admin = require('firebase-admin');

const userCollection = admin.firestore().collection('users');

function serializeTimestamps(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (val && typeof val.toDate === 'function') {
      out[key] = val.toDate().toISOString();
    } else if (val instanceof Date) {
      out[key] = val.toISOString();
    }
  }
  return out;
}

class User {
  static async create(userData) {
    try {
      const { email, password, name } = userData;

      // Check if user exists in Firestore
      const existingUser = await userCollection.where('email', '==', email).get();
      if (!existingUser.empty) {
        throw new Error('User already exists');
      }

      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });

      // Store user data in Firestore
      await userCollection.doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { uid: userRecord.uid, email, name };
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new Error('User already exists');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const snapshot = await userCollection.where('email', '==', email).limit(1).get();
      if (snapshot.empty) {
        return null;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...serializeTimestamps(doc.data()) };
    } catch (error) {
      throw error;
    }
  }

  static async findById(uid) {
    try {
      const doc = await userCollection.doc(uid).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...serializeTimestamps(doc.data()) };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
