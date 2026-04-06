const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin Initialized successfully");
  const db = admin.firestore();
  db.collection('users').limit(1).get()
    .then(snapshot => {
      console.log("Firestore connection successful, found docs:", snapshot.size);
      process.exit(0);
    })
    .catch(err => {
      console.error("Firestore error:", err);
      process.exit(1);
    });
} catch (e) {
  console.error("Initialization error:", e);
  process.exit(1);
}
