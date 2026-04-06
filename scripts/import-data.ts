import fs from 'fs';
import path from 'path';
import { COLLECTIONS } from '../src/lib/firebase/admin';
import { createDocument } from '../src/lib/firebase/firestore';

async function importData() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('❌ Thiếu tham số!');
    console.log('💡 Cách dùng: npx tsx scripts/import-data.ts <path_to_json> <collection_name>');
    console.log('Ví dụ: npx tsx scripts/import-data.ts ./data/users.json users');
    process.exit(1);
  }

  const [filePath, collectionName] = args;
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Không tìm thấy tệp: ${absolutePath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(absolutePath, 'utf8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      console.error('❌ Dữ liệu trong tệp JSON phải là một mảng (Array).');
      process.exit(1);
    }

    console.log(`🚀 Bắt đầu nhập ${data.length} bản ghi vào collection "${collectionName}"...`);

    let successCount = 0;
    for (const item of data) {
      try {
        const id = await createDocument(collectionName, item);
        console.log(`✅ Đã nhập thành công: ID ${id}`);
        successCount++;
      } catch (err) {
        console.error(`⚠️ Lỗi khi nhập bản ghi:`, err);
      }
    }

    console.log('\n--- KẾT QUẢ ---');
    console.log(`🎉 Thành công: ${successCount}/${data.length}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi hệ thống:', error);
    process.exit(1);
  }
}

importData();
