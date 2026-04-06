const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function fixGroups() {
    console.log('--- Fixing Study Groups ID Mismatches ---');
    const snapshot = await db.collection('studyGroups').get();

    let fixCount = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.id !== doc.id) {
            console.log(`Fixing doc: ${doc.id} (name: ${data.name}) - current data.id: ${data.id}`);
            await doc.ref.update({ id: doc.id });
            fixCount++;
        }
    }
    console.log(`\n🎉 Success: Updated ${fixCount} groups!`);
    process.exit(0);
}

fixGroups();
