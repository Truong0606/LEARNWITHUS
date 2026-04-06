const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function run() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const passwordHash = await hashPassword('123456');
  const now = admin.firestore.Timestamp.now();

  let vipEmail = '';
  // VIP
  const vipSnap = await db.collection('users')
    .where('vipExpiresAt', '>', now)
    .limit(1)
    .get();

  if (!vipSnap.empty) {
    const vipDoc = vipSnap.docs[0];
    await vipDoc.ref.update({ passwordHash });
    vipEmail = vipDoc.data().email;
  } else {
    // Try any VIP plan
    const anyVipSnap = await db.collection('users')
      .where('vipPlan', '!=', null)
      .limit(1)
      .get();
    if (!anyVipSnap.empty) {
      const vipDoc = anyVipSnap.docs[0];
      await vipDoc.ref.update({ passwordHash });
      vipEmail = vipDoc.data().email;
    }
  }

  let mentorEmail = '';
  // Mentor
  const mentorSnap = await db.collection('users')
    .where('role', '==', 4)
    .limit(1)
    .get();

  if (!mentorSnap.empty) {
    const mentorDoc = mentorSnap.docs[0];
    await mentorDoc.ref.update({ passwordHash });
    mentorEmail = mentorDoc.data().email;
  }

  const finalResult = `VIP_EMAIL: ${vipEmail}\nMENTOR_EMAIL: ${mentorEmail}\nPASSWORD: 123456`;
  fs.writeFileSync(path.join(process.cwd(), 'scripts/results.txt'), finalResult, 'utf8');
}

run().then(() => process.exit(0)).catch(err => {
  fs.writeFileSync(path.join(process.cwd(), 'scripts/results.txt'), 'ERROR: ' + err.message, 'utf8');
  process.exit(1);
});
