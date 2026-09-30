# Student Task Manager

React Native/Expo mobile app with a Node.js/Express backend and Firebase Admin/Firestore.

## Features (updated)

- Email/password register & login (password verified via Firebase Identity Toolkit)
- **Google Sign-In** (Firebase Auth + backend JWT)
- Student ID field **removed** from registration
- Responsive, mobile-friendly top bar and navigation
- **Date & time picker** for task due dates
- Mark tasks as **Pending / In Progress / Completed** (list + detail)
- **Filter menu** by status (All, Pending, In Progress, Completed)
- **Due-date alerts** (overdue, within 2 hours, within 24 hours) via Alert + notifications
- Firestore timestamps serialized to ISO strings in API responses
- Tasks ordered newest-first

## Project structure

- `backend/` — Express API, JWT middleware, Firebase Admin
- `mobile-app/` — React Native / Expo app
- `README.md` — this file

---

## 1. Backend setup

```bash
cd backend
npm install
```

Ensure `.env` has (service account already filled from the JSON you provided):

```
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_to_something_secure
FIREBASE_PROJECT_ID=student-task-manager-1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@student-task-manager-1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Web API Key from Firebase Console → Project settings → General (needed for secure email/password login)
FIREBASE_WEB_API_KEY=YOUR_FIREBASE_WEB_API_KEY
```

Get the **Web API Key**: Firebase Console → Project settings (gear) → General → Your apps / Web API Key.

```bash
npm run dev
# or: npm start
```

API routes:

- `GET  /health` — health check
- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/google` — `{ idToken }` (Firebase ID token from Google sign-in)
- `GET  /api/auth/profile` — Bearer token
- Tasks: `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/:id`

---

## 2. Mobile app setup

```bash
cd mobile-app
npm install
```

### Packages you need (already listed in package.json)

Run `npm install` so these are installed:

| Package | Purpose |
|---------|---------|
| `expo-auth-session` | Google OAuth flow |
| `expo-web-browser` | Browser for Google login |
| `expo-crypto` | Auth session helper |
| `firebase` | Firebase client (Google credential → ID token) |
| `@react-native-community/datetimepicker` | Due date & time calendar |
| `expo-notifications` | Due-date alerts |
| (existing) `axios`, `@react-navigation/*`, `@react-native-async-storage/async-storage`, `@react-native-picker/picker`, etc. |

### Configure API URL

Edit `mobile-app/src/services/api.js`:

```js
const API_URL = 'http://YOUR_COMPUTER_IP:5000/api';
```

Use your PC’s LAN IP (not `localhost`) when testing on a physical phone.

### Configure Firebase (Google Sign-In)

1. Open `mobile-app/src/config/firebase.js` and put your **Firebase web app** config (Project settings → Your apps).
2. Open `mobile-app/src/context/AuthContext.js` and set Google client IDs:

   - `expoClientId` / `webClientId` → Web client ID from Firebase / Google Cloud Console  
   - Optional: `androidClientId`, `iosClientId` for standalone builds  

3. In Firebase Console → Authentication → Sign-in method → **Google** must be enabled (you said this is already done).
4. Also enable **Email/Password** provider if you use register/login.

### Start the app

```bash
npx expo start
```

Then open in Expo Go (Android/iOS) or a simulator.

---

## 3. Google Sign-In flow (how it works)

1. User taps **Continue with Google**.
2. Expo Auth Session opens Google OAuth.
3. App gets Google `id_token` → signs into Firebase Auth client → gets **Firebase ID token**.
4. App sends Firebase ID token to `POST /api/auth/google`.
5. Backend verifies token with Firebase Admin, creates user in Firestore if needed, returns JWT + user.

---

## Notes

- `node_modules` are not included. Always run `npm install` in both `backend` and `mobile-app`.
- Do not commit real Firebase private keys to public repos.
- Due alerts run when the home screen loads tasks (overdue / within 2h / within 24h). Notification permission is requested on first open.
- If you see Firestore index errors for `userId + createdAt`, create the composite index from the link in the error, or the API will fall back to in-memory sorting.
