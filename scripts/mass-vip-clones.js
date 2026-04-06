const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const path = require('path');

const oldServiceAccount = {
  "type": "service_account",
  "project_id": "bloodline-dna-nextjs",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCy/9i5FP6jTMft\ngWnmYU130QQCmLcpxr5U2GG8+NR1KFf/fL+4luklHkuNCcz7ZutOjDwAq9/w11BW\n6/hnWZnuBT2CM7LKBHUkVlHWDRz1yi/X1owKajOowhboCR+z+OyMFY7rmK3520k+\n87iU06dMUGiqL27cvqo6GMEryp9GKC24r3SX1OrW8tYWxiB2oaZVlRDFL/i1xKav\n92Sb0lHCBWF02cyO05DVHUBAinwqe0Yeq4ckMqsh/Ks1ASn2gelEfbKXooyQc9A8\nwQlgvZhVWaXb36tGkpABCS015ASdWmkVHKPf/hXC6ZTRe80XIpAiefCuPpdfnFpI\nJd8WJyKFAgMBAAECggEAJGnPmLcgpe+0rCgrduZMcBdhDXYrrJ/1kCUEnQCxl7PB\nUwP5rH9mplpnXCWmQW5KaAw3GJveTow+l7AhNEUR/02pmZcSw+3sNpwowbahMY8T\n9IB8tJGuOKJjLojMnjwBQu4PyPWiTrXBTMEfx4bW/btNz3EeyGExF+h5Q4NQq2Ch\nhDlR3Jqi2npngHgINpggGzafWkCYclxF2FgLGk/6ndnm2z2qNF/j86yycRqF1uhd\nokyLAMH3oWzsz4bB/sHBhEOUiap10qqlsYwmPffuihaIF+UyjYdiR6p0kRaQW6oG\nrU/M708WSxWsdj77uE8iJ+pLo0fMpPSRdQP0j+M9gQKBgQDsoCAvydcc0avaZt0v\naNIqiw5n9Xa0+MkuJUjfjZUn1b+oZ36L84imP6QOYZXNWDQiKEGH7CZRBXVLN3CB\nNRDBFPTCQf2AqO0dTHk9va/eZ3c9+jt+ESl2N/3Rf7lQsm0540LDzgFacv0DYJsN\nqs8n6kQxrQuL3UtL82eY+LizyQKBgQDBp9QMZBBnE7FmjFtfOPhLG5UgdgNos+e6\nM1Cr4ASxORHw3pIQt10wt7eZS9m+YsmgVv8OP46Il3y7iV0D5bM00fZMLDAUBj1+\njVEX3cUOdKlLuSONtBslBHq5lE+yQw5SAFbgArO7zuNIeaUHyiFH+oZTcZRwRCfq\n5Gxd2f9+3QKBgAEeiMhxFflm7H8t+WHeBxB4c+r9+D/G5Xy4ZG3aR5hWpH9xbeHP\nlxfiOS5wO7sq7aQzuIuiDFRZyEJA0uFplNi09qtskHxpUCXRVMl7+jb9Gk1Kv7lK\n731FqoexKPk+vtGFR62RbeQ1owi/Djy0UCKKMyRhAyr4MwD698R7eLQxAoGAZ5KG\nI7Zk22w55hnNSKlkim8PHBRiEF6f4gNN8w7WE57tTIENZ+lZ6xNnG5Loux2Err+4\nm/s8FSvIJ1j5KXtxlB9zdhvv/tWzj/qu02/l06xrWzeCn2gjWHID3TtIQJQClbLe\nw+JOFHU7M+jzba4ajK+dpgVKGZ0qKEPQ/YT5U/UCgYEAkkZcknPK7Lu5FpXqw2BU\n+ltPKZyBfHNs0wX6U1effebgLNz0fWYoti44jyiS5eQS7iJsonPJs10s8QyjnQkd\nHjaIGr7q840gwRhsi82hyCBnrd3keH91eZYjpRHAirWStGsoM2fWLQJlLj6ew1q2\nVD/HMBg8yCfQ7hcDuuXsr+Q=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@bloodline-dna-nextjs.iam.gserviceaccount.com"
};

const newServiceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

const codes = [
  '033093', '346436', '714982', '346634', '582103', 
  '636546', '658349', '551086', 'E48544', 'C47167', 
  'AF3799', '8C2994', 'E18074'
];

async function createClones(projectTag, serviceAccount) {
  const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, projectTag);
  const db = app.firestore();
  const hash = await bcrypt.hash('123456', 10);
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);

  for (const code of codes) {
    const email = `vip_${code.toLowerCase()}@gmail.com`;
    const desc = `VIP Hàng tháng ${code}`;
    
    // Check if user exists
    let userSnap = await db.collection('users').where('email', '==', email).get();
    let userId;
    
    if (userSnap.empty) {
      const userRef = await db.collection('users').add({
        email,
        fullName: `VIP Clone ${code}`,
        role: 2,
        passwordHash: hash,
        vipPlan: 'monthly',
        vipExpiresAt: admin.firestore.Timestamp.fromDate(expiry),
        vipFreeSessionsMonthKey: `${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
        vipFreeSessionsUsed: 0,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      userId = userRef.id;
      await userRef.update({ id: userId });
      console.log(`[${projectTag}] Created user ${email}`);
    } else {
      userId = userSnap.docs[0].id;
      await userSnap.docs[0].ref.update({
        vipPlan: 'monthly',
        vipExpiresAt: admin.firestore.Timestamp.fromDate(expiry)
      });
      console.log(`[${projectTag}] Updated user ${email}`);
    }

    // Check if payment exists
    const paySnap = await db.collection('payments').where('description', '==', desc).get();
    if (paySnap.empty) {
      await db.collection('payments').add({
        userId,
        userEmail: email,
        amount: 132000,
        description: desc,
        status: 2, // Paid
        type: 'vip',
        plan: 'monthly',
        orderId: `cln_${code}_${Date.now()}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[${projectTag}] Added payment for ${code}`);
    }
  }
}

async function main() {
  await createClones('old', oldServiceAccount);
  await createClones('new', newServiceAccount);
  process.exit(0);
}

main();
