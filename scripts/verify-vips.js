const admin = require('firebase-admin');
const path = require('path');

const newServiceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));

async function verifyDetails() {
  const app = admin.initializeApp({ credential: admin.credential.cert(newServiceAccount) });
  const db = app.firestore();

  const pSnap = await db.collection('payments').where('paymentFor', '==', 'vip_upgrade').orderBy('paidAt', 'asc').limit(5).get();
  
  console.log("--- KẾT QUẢ SOI DỮ LIỆU ĐỐI CHIẾU ---");
  pSnap.docs.forEach((doc, i) => {
    const data = doc.data();
    const paidAt = data.paidAt.toDate().toLocaleString('vi-VN');
    console.log(`\nHóa đơn số ${i+1}:`);
    console.log(`- Mã Bill: ${data.description.split(': ')[1]}`);
    console.log(`- Thời gian nạp: ${paidAt}`);
    console.log(`- Nội dung ghi vào sổ: ${data.description}`);
  });
}

verifyDetails().then(() => process.exit(0));
