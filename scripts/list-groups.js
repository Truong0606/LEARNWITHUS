const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listGroups() {
    const studyGroups = await db.collection('studyGroups').get();
    console.log('--- Current Study Groups ---');
    studyGroups.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Doc ID: ${doc.id}, data.id: ${data.id}, name: ${data.name}`);
    });
}

listGroups();
