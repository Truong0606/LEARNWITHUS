const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkMemberships() {
    const memberships = await db.collection('groupMembers').get();
    console.log('--- Checking groupMembers ---');
    memberships.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Doc ID: ${doc.id}, data.id: ${data.id}, groupId: ${data.groupId}, userId: ${data.userId}`);
    });
}

checkMemberships();
