const fs = require('fs');
const path = require('path');

const exclude = ['node_modules', '.next', '.git'];

const recoverSequences = (s) => {
  // Matches 2 or more characters in the range \u0080-\u00FF (latin-1 high-bit chars)
  return s.replace(/[\u007F-\u00FF]{2,}/g, (match) => {
    try {
      const buf = Buffer.from(match, 'binary');
      const dec = buf.toString('utf8');
      // If the decoded result is "cleaner" (no Replacement Char and shorter)
      if (!dec.includes('\ufffd') && dec.length < match.length) {
         return dec;
      }
    } catch (e) {}
    return match;
  });
};

const processFile = (fullPath) => {
  const s = fs.readFileSync(fullPath, 'utf8');
  const fixed = recoverSequences(s);
  
  if (fixed !== s) {
     fs.writeFileSync(fullPath, fixed, 'utf8');
     console.log(`FIXED: ${fullPath}`);
     return true;
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
console.log('Safe sequence recovery finished.');
