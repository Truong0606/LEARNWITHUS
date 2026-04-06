const admin = require('firebase-admin');

const oldServiceAccount = {
  "type": "service_account",
  "project_id": "bloodline-dna-nextjs",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCy/9i5FP6jTMft\ngWnmYU130QQCmLcpxr5U2GG8+NR1KFf/fL+4luklHkuNCcz7ZutOjDwAq9/w11BW\n6/hnWZnuBT2CM7LKBHUkVlHWDRz1yi/X1owKajOowhboCR+z+OyMFY7rmK3520k+\n87iU06dMUGiqL27cvqo6GMEryp9GKC24r3SX1OrW8tYWxiB2oaZVlRDFL/i1xKav\n92Sb0lHCBWF02cyO05DVHUBAinwqe0Yeq4ckMqsh/Ks1ASn2gelEfbKXooyQc9A8\nwQlgvZhVWaXb36tGkpABCS015ASdWmkVHKPf/hXC6ZTRe80XIpAiefCuPpdfnFpI\nJd8WJyKFAgMBAAECggEAJGnPmLcgpe+0rCgrduZMcBdhDXYrrJ/1kCUEnQCxl7PB\nUwP5rH9mplpnXCWmQW5KaAw3GJveTow+l7AhNEUR/02pmZcSw+3sNpwowbahMY8T\n9IB8tJGuOKJjLojMnjwBQu4PyPWiTrXBTMEfx4bW/btNz3EeyGExF+h5Q4NQq2Ch\nhDlR3Jqi2npngHgINpggGzafWkCYclxF2FgLGk/6ndnm2z2qNF/j86yycRqF1uhd\nokyLAMH3oWzsz4bB/sHBhEOUiap10qqlsYwmPffuihaIF+UyjYdiR6p0kRaQW6oG\nrU/M708WSxWsdj77uE8iJ+pLo0fMpPSRdQP0j+M9gQKBgQDsoCAvydcc0avaZt0v\naNIqiw5n9Xa0+MkuJUjfjZUn1b+oZ36L84imP6QOYZXNWDQiKEGH7CZRBXVLN3CB\nNRDBFPTCQf2AqO0dTHk9va/eZ3c9+jt+ESl2N/3Rf7lQsm0540LDzgFacv0DYJsN\nqs8n6kQxrQuL3UtL82eY+LizyQKBgQDBp9QMZBBnE7FmjFtfOPhLG5UgdgNos+e6\nM1Cr4ASxORHw3pIQt10wt7eZS9m+YsmgVv8OP46Il3y7iV0D5bM00fZMLDAUBj1+\njVEX3cUOdKlLuSONtBslBHq5lE+yQw5SAFbgArO7zuNIeaUHyiFH+oZTcZRwRCfq\n5Gxd2f9+3QKBgAEeiMhxFflm7H8t+WHeBxB4c+r9+D/G5Xy4ZG3aR5hWpH9xbeHP\nlxfiOS5wO7sq7aQzuIuiDFRZyEJA0uFplNi09qtskHxpUCXRVMl7+jb9Gk1Kv7lK\n731FqoexKPk+vtGFR62RbeQ1owi/Djy0UCKKMyRhAyr4MwD698R7eLQxAoGAZ5KG\nI7Zk22w55hnNSKlkim8PHBRiEF6f4gNN8w7WE57tTIENZ+lZ6xNnG5Loux2Err+4\nm/s8FSvIJ1j5KXtxlB9zdhvv/tWzj/qu02/l06xrWzeCn2gjWHID3TtIQJQClbLe\nw+JOFHU7M+jzba4ajK+dpgVKGZ0qKEPQ/YT5U/UCgYEAkkZcknPK7Lu5FpXqw2BU\n+ltPKZyBfHNs0wX6U1effebgLNz0fWYoti44jyiS5eQS7iJsonPJs10s8QyjnQkd\nHjaIGr7q840gwRhsi82hyCBnrd3keH91eZYjpRHAirWStGsoM2fWLQJlLj6ew1q2\nVD/HMBg8yCfQ7hcDuuXsr+Q=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@bloodline-dna-nextjs.iam.gserviceaccount.com"
};

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(oldServiceAccount)
  });
}

const db = admin.firestore();

async function list() {
  const snap = await db.collection('payments').get();
  snap.forEach(d => {
    const data = d.data();
    if (data.description) {
      console.log(`DESC: [${data.description}]`);
    }
  });
  process.exit(0);
}
list();
