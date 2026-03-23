const fs = require('fs');
const path = require('path');
const exclude = ['node_modules', '.next', '.git'];
const exts = ['.tsx', '.ts', '.css', '.json', '.js', '.md', '.html'];

const fixAll = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!exclude.includes(e.name)) fixAll(p);
    } else if (exts.includes(path.extname(e.name))) {
      try {
        const originalContent = fs.readFileSync(p, 'utf8');
        let c = originalContent;
        
        // 1. Fix Mojibake (Double Encoding)
        if (c.includes('Ã') || c.includes('Ä') || c.includes('áº') || c.includes('á»')) {
          const f = Buffer.from(c, 'binary').toString('utf8');
          if (!f.includes('\uFFFD') && f !== c) { 
            c = f; 
          }
        }
        
        // 2. Rename branding to be sure
        c = c.replace(/Learn With Us/g, 'Learn With Us');
        c = c.replace(/learnwithus/g, 'learnwithus');
        
        if (c !== originalContent) {
          fs.writeFileSync(p, c, 'utf8');
          console.log(`Fixed: ${p}`);
        }
      } catch (err) {}
    }
  });
};

fixAll('.');
console.log('Done.');
