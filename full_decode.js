const fs = require('fs');
const path = require('path');

const exclude = ['node_modules', '.next', '.git'];

const processFile = (fullPath) => {
  const s = fs.readFileSync(fullPath, 'utf8');
  
  // Trick: Treat each UTF-16 character as a byte and re-decode from UTF-8
  const recovered = Buffer.from(s, 'binary').toString('utf8');
  
  if (recovered !== s && !recovered.includes('\uFFFD')) {
     // Check if we gained any "power" (more Vietnamese chars)
     const vietMatch = recovered.match(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i);
     if (vietMatch) {
        fs.writeFileSync(fullPath, recovered, 'utf8');
        console.log(`FIXED: ${fullPath}`);
        return true;
     }
  }
  return false;
};

const scan = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
       if (!exclude.includes(entry.name)) scan(fullPath);
    } else {
       if (['.tsx', '.ts', '.css', '.js'].includes(path.extname(fullPath))) {
          processFile(fullPath);
       }
    }
  }
};

scan('src');
console.log('Final full decode finished.');
