# Travel Planner

This app uses Firebase Authentication with Google sign-in and Firestore to store each user's trip dates and stop data.

## Firebase setup

1. Create a Firebase project.
2. Enable Google sign-in in Authentication.
3. Create a Firestore database.
4. Add the following environment variables in a `.env` file at the project root:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Restart the Vite dev server after creating or changing the env file.

## Data model

Trip data is stored in the Firestore document at `users/{uid}` with fields for:

- `tripStartDate`
- `tripEndDate`
- `selectedDateKey`
- `stopsByDate`

## Development

```bash
npm install
npm run dev
```
