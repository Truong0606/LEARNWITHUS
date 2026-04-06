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
  { code: '033093', date: '2025-11-18T11:23:00', realName: 'Nguyễn Phương Thảo' },
  { code: '033093', date: '2026-03-12T06:15:00', realName: 'Nguyễn Phương Thảo' },
  { code: '033093', date: '2026-03-22T07:56:00', realName: 'Nguyễn Phương Thảo' },
  { code: '346436', date: '2025-12-15T16:45:00', realName: 'Trần Anh Tuấn' },
  { code: '714982', date: '2026-01-15T10:23:00', realName: 'Lê Thị Mai' },
  { code: '346634', date: '2026-03-18T09:11:00', realName: 'Phạm Hồng Quân' },
  { code: '582103', date: '2026-02-22T14:18:00', realName: 'Hoàng Gia Bảo' },
  { code: '636546', date: '2026-03-08T18:42:00', realName: 'Vũ Tuyết Nhi' },
  { code: '658349', date: '2026-03-22T19:11:00', realName: 'Phan Văn Hải' },
  { code: '658349', date: '2026-03-26T16:35:00', realName: 'Phan Văn Hải' },
  { code: '551086', date: '2026-03-22T12:02:00', realName: 'Bùi Bích Phương' },
  { code: 'E48544', date: '2026-03-22T18:31:00', realName: 'Đặng Thanh Tùng' },
  { code: 'AF3799', date: '2026-03-22T18:57:00', realName: 'Ngô Mỹ Hạnh' },
  { code: 'AF3799', date: '2026-03-21T16:39:00', realName: 'Ngô Mỹ Hạnh' },
  { code: 'C47167', date: '2026-03-22T06:31:00', realName: 'Trịnh Ngọc Duy' },
  { code: '557863', date: '2026-03-21T17:50:00', realName: 'Đỗ Thùy Linh' },
  { code: '8C2994', date: '2026-03-21T17:52:00', realName: 'Vương Kiến Quốc' },
  { code: 'E18074', date: '2026-03-21T16:43:00', realName: 'Lý Gia Thành' },
  { code: '060179', date: '2026-03-21T16:47:00', realName: 'Tô Minh Hiếu' },
  { code: 'VS1710', date: '2026-03-22T06:43:00', realName: 'Đinh Thị Thủy' }
];

async function cleanSweep(projectTag, serviceAccount) {
  const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, projectTag);
  const db = app.firestore();

  // 1. Delete ALL vip_upgrade payments
  const vipUpgrades = await db.collection('payments').where('paymentFor', '==', 'vip_upgrade').get();
  for (const doc of vipUpgrades.docs) await doc.ref.delete();
  console.log(`[${projectTag}] Wiped all VIP upgrade payments`);

  // 2. Demote ALL non-image VIPs
  const vipEmails = imagesData.map(i => `vip_${i.code.toLowerCase()}@gmail.com`);
  const allVips = await db.collection('users').where('vipPlan', '!=', '').get();
  for (const doc of allVips.docs) {
    if (!vipEmails.includes(doc.data().email)) {
      await doc.ref.update({ vipPlan: '', vipExpiresAt: null });
    }
  }
  console.log(`[${projectTag}] Demoted non-image VIP users`);

  // 3. Inject 20 accurate bills
  for (let i = 0; i < imagesData.length; i++) {
    const item = imagesData[i];
    const email = `vip_${item.code.toLowerCase()}@gmail.com`;
    const paidAt = new Date(item.date);
    const expiry = new Date(paidAt);
    expiry.setMonth(expiry.getMonth() + 1);

    // Ensure User exists and is VIP
    const userSnap = await db.collection('users').where('email', '==', email).get();
    let userId;
    if (userSnap.empty) {
      const uRef = await db.collection('users').add({
        email, fullName: item.realName, role: 2, isActive: true,
        vipPlan: 'monthly', vipExpiresAt: admin.firestore.Timestamp.fromDate(expiry),
        createdAt: admin.firestore.Timestamp.fromDate(paidAt)
      });
      userId = uRef.id;
      await uRef.update({ id: userId });
    } else {
      userId = userSnap.docs[0].id;
      await userSnap.docs[0].ref.update({
        fullName: item.realName,
        vipPlan: 'monthly',
        vipExpiresAt: admin.firestore.Timestamp.fromDate(expiry)
      });
    }

    // Add exactly one payment record per image
    await db.collection('payments').add({
      userId, userEmail: email, amount: 132000,
      description: `Nâng cấp VIP Hàng tháng - Mã bill: ${item.code}`,
      paymentFor: 'vip_upgrade',
      status: 2, type: 'vip', plan: 'monthly',
      orderId: `final_${i}_${item.code}_${Date.now()}`,
      paidAt: admin.firestore.Timestamp.fromDate(paidAt),
      createdAt: admin.firestore.Timestamp.fromDate(paidAt),
      updatedAt: admin.firestore.Timestamp.fromDate(paidAt)
    });
    console.log(`[${projectTag}] Final Injected Image ${i+1}/20: ${item.realName} (${paidAt.toLocaleDateString()})`);
  }
}

async function main() {
  await cleanSweep('old', oldServiceAccount);
  await cleanSweep('new', newServiceAccount);
  process.exit(0);
}

main();
