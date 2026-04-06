const admin = require('firebase-admin');
const path = require('path');

const oldServiceAccount = {
  "type": "service_account",
  "project_id": "bloodline-dna-nextjs",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCy/9i5FP6jTMft\ngWnmYU130QQCmLcpxr5U2GG8+NR1KFf/fL+4luklHkuNCcz7ZutOjDwAq9/w11BW\n6/hnWZnuBT2CM7LKBHUkVlHWDRz1yi/X1owKajOowhboCR+z+OyMFY7rmK3520k+\n87iU06dMUGiqL27cvqo6GMEryp9GKC24r3SX1OrW8tYWxiB2oaZVlRDFL/i1xKav\n92Sb0lHCBWF02cyO05DVHUBAinwqe0Yeq4ckMqsh/Ks1ASn2gelEfbKXooyQc9A8\nwQlgvZhVWaXb36tGkpABCS015ASdWmkVHKPf/hXC6ZTRe80XIpAiefCuPpdfnFpI\nJd8WJyKFAgMBAAECggEAJGnPmLcgpe+0rCgrduZMcBdhDXYrrJ/1kCUEnQCxl7PB\nUwP5rH9mplpnXCWmQW5KaAw3GJveTow+l7AhNEUR/02pmZcSw+3sNpwowbahMY8T\n9IB8tJGuOKJjLojMnjwBQu4PyPWiTrXBTMEfx4bW/btNz3EeyGExF+h5Q4NQq2Ch\nhDlR3Jqi2npngHgINpggGzafWkCYclxF2FgLGk/6ndnm2z2qNF/j86yycRqF1uhd\nokyLAMH3oWzsz4bB/sHBhEOUiap10qqlsYwmPffuihaIF+UyjYdiR6p0kRaQW6oG\nrU/M708WSxWsdj77uE8iJ+pLo0fMpPSRdQP0j+M9gQKBgQDsoCAvydcc0avaZt0v\naNIqiw5n9Xa0+MkuJUjfjZUn1b+oZ36L84imP6QOYZXNWDQiKEGH7CZRBXVLN3CB\nNRDBFPTCQf2AqO0dTHk9va/eZ3c9+jt+ESl2N/3Rf7lQsm0540LDzgFacv0DYJsN\qs8n6kQxrQuL3UtL82eY+LizyQKBgQDBp9QMZBBnE7FmjFtfOPhLG5UgdgNos+e6\nM1Cr4ASxORHw3pIQt10wt7eZS9m+YsmgVv8OP46Il3y7iV0D5bM00fZMLDAUBj1+\njVEX3cUOdKlLuSONtBslBHq5lE+yQw5SAFbgArO7zuNIeaUHyiFH+oZTcZRwRCfq\n5Gxd2f9+3QKBgAEeiMhxFflm7H8t+WHeBxB4c+r9+D/G5Xy4ZG3aR5hWpH9xbeHP\nlxfiOS5wO7sq7aQzuIuiDFRZyEJA0uFplNi09qtskHxpUCXRVMl7+jb9Gk1Kv7lK\n731FqoexKPk+vtGFR62RbeQ1owi/Djy0UCKKMyRhAyr4MwD698R7eLQxAoGAZ5KG\I7Zk22w55hnNSKlkim8PHBRiEF6f4gNN8w7WE57tTIENZ+lZ6xNnG5Loux2Err+4\nm/s8FSvIJ1j5KXtxlB9zdhvv/tWzj/qu02/l06xrWzeCn2gjWHID3TtIQJQClbLe\nw+JOFHU7M+jzba4ajK+dpgVKGZ0qKEPQ/YT5U/UCgYEAkkZcknPK7Lu5FpXqw2BU\n+ltPKZyBfHNs0wX6U1effebgLNz0fWYoti44jyiS5eQS7iJsonPJs10s8QyjnQkd\nHjaIGr7q840gwRhsi82hyCBnrd3keH91eZYjpRHAirWStGsoM2fWLQJlLj6ew1q2\nVD/HMBg8yCfQ7hcDuuXsr+Q=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@bloodline-dna-nextjs.iam.gserviceaccount.com"
};

const newServiceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

const imagesData = [
  { code: '033093', date: '2025-11-18T11:23:00' },
  { code: '033093', date: '2026-03-12T06:15:00' },
  { code: '033093', date: '2026-03-22T07:56:00' },
  { code: '346436', date: '2025-12-15T16:45:00' },
  { code: '714982', date: '2026-01-15T10:23:00' },
  { code: '346634', date: '2026-03-18T09:11:00' },
  { code: '582103', date: '2026-02-22T14:18:00' },
  { code: '636546', date: '2026-03-08T18:42:00' },
  { code: '658349', date: '2026-03-22T19:11:00' },
  { code: '658349', date: '2026-03-26T16:35:00' },
  { code: '551086', date: '2026-03-22T12:02:00' },
  { code: 'E48544', date: '2026-03-22T18:31:00' },
  { code: 'AF3799', date: '2026-03-22T18:57:00' },
  { code: 'AF3799', date: '2026-03-21T16:39:00' },
  { code: 'C47167', date: '2026-03-22T06:31:00' },
  { code: '557863', date: '2026-03-21T17:50:00' },
  { code: '8C2994', date: '2026-03-21T17:52:00' },
  { code: 'E18074', date: '2026-03-21T16:43:00' },
  { code: '060179', date: '2026-03-21T16:47:00' },
  { code: 'VS1710', date: '2026-03-22T06:43:00' }
];

async function syncAll20(projectTag, serviceAccount) {
  const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, projectTag);
  const db = app.firestore();

  // 1. Cleanup old clones payments ONLY if they were cln_
  const clnPayments = await db.collection('payments').where('orderId', '>=', 'cln_').where('orderId', '<=', 'cln_\uf8ff').get();
  for (const doc of clnPayments.docs) {
    await doc.ref.delete();
  }
  console.log(`[${projectTag}] Cleaned up old clone payments`);

  for (let i = 0; i < imagesData.length; i++) {
    const item = imagesData[i];
    const email = `vip_${item.code.toLowerCase()}@gmail.com`;
    const paidAt = new Date(item.date);
    const expiry = new Date(paidAt);
    expiry.setMonth(expiry.getMonth() + 1);

    // 2. Ensure User exists
    let userSnap = await db.collection('users').where('email', '==', email).get();
    let userId;
    if (userSnap.empty) {
      const userRef = await db.collection('users').add({
        email,
        fullName: `VIP Clone ${item.code}`,
        role: 2,
        passwordHash: '$2a$10$7Z2v7Z2v7Z2v7Z2v7Z2v7u', // dummy
        vipPlan: 'monthly',
        vipExpiresAt: admin.firestore.Timestamp.fromDate(expiry),
        isActive: true,
        createdAt: admin.firestore.Timestamp.fromDate(paidAt)
      });
      userId = userRef.id;
      await userRef.update({ id: userId });
    } else {
      userId = userSnap.docs[0].id;
      // Update expiry to latest if needed (simplified)
      await userSnap.docs[0].ref.update({
        vipPlan: 'monthly',
        vipExpiresAt: admin.firestore.Timestamp.fromDate(expiry)
      });
    }

    // 3. Add Payment (One for each image entry)
    await db.collection('payments').add({
      userId,
      userEmail: email,
      amount: 132000,
      description: `VIP Hàng tháng ${item.code}`,
      paymentFor: 'vip_upgrade',
      status: 2,
      type: 'vip',
      plan: 'monthly',
      orderId: `img_${i}_${item.code}_${Date.now()}`,
      paidAt: admin.firestore.Timestamp.fromDate(paidAt),
      createdAt: admin.firestore.Timestamp.fromDate(paidAt),
      updatedAt: admin.firestore.Timestamp.fromDate(paidAt)
    });
    console.log(`[${projectTag}] Added payment for image ${i+1}/${imagesData.length} (Code: ${item.code})`);
  }
}

async function main() {
  await syncAll20('old', oldServiceAccount);
  await syncAll20('new', newServiceAccount);
  process.exit(0);
}

main();
