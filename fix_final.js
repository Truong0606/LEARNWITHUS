const fs = require('fs');
const path = require('path');

const exclude = ['node_modules', '.next', '.git'];

// Mapping for Windows-1252 characters often found in Mojibake from 0x80 to 0x9F
const win1252ToByte = {
  '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84, '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87,
  '\u02C6': 0x88, '\u2030': 0x89, '\u0160': 0x8A, '\u2039': 0x8B, '\u0152': 0x8C, '\u017D': 0x8E,
  '\u2018': 0x91, '\u2019': 0x92, '\u201C': 0x93, '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B, '\u0153': 0x9C, '\u017E': 0x9E, '\u0178': 0x9F
};

const stringToBytes = (s) => {
  const bytes = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const code = c.charCodeAt(0);
    if (win1252ToByte[c]) {
      bytes.push(win1252ToByte[c]);
    } else if (code <= 0xFF) {
      bytes.push(code);
    } else {
      // If we encounter a character out of range, this sequence is probably not fixable this way
      return null;
    }
  }
  return Buffer.from(bytes);
};

const recoverMojibake = (s) => {
  // Matches 2 or more characters that are either Latin-1 high-bit or special Win-1252 symbols
  const regex = /[\u0080-\u00FF\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]{2,}/g;
  
  return s.replace(regex, (match) => {
    const buf = stringToBytes(match);
    if (!buf) return match;
    
    const dec = buf.toString('utf8');
    if (!dec.includes('\ufffd') && dec.length < match.length) {
      return dec;
    }
    return match;
  });
};

const processFile = (fullPath) => {
  if (fullPath.includes('node_modules')) return;
  const s = fs.readFileSync(fullPath, 'utf8');
  const fixed = recoverMojibake(s);
  
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
    } else if (['.tsx', '.ts', '.css', '.js'].includes(path.extname(fullPath))) {
      processFile(fullPath);
    }
  }
};

scan('src');
console.log('Final comprehensive recovery finished.');
