const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const oldNextDir = path.join(outDir, '_next');
const newNextDir = path.join(outDir, 'assets');

// 1. Rename _next to assets
if (fs.existsSync(oldNextDir)) {
  fs.renameSync(oldNextDir, newNextDir);
  console.log('Renamed _next to assets');
} else if (!fs.existsSync(newNextDir)) {
  console.error('_next directory not found!');
  process.exit(1);
}

// 2. Recursively find all HTML, JS, CSS files
function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(outDir);

// 3. Replace all occurrences of _next with assets
let replacedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('/_next/') || content.includes('"_next/')) {
    // Replace absolute paths
    content = content.replace(/\/_next\//g, '/assets/');
    // Replace relative paths in JS strings if any
    content = content.replace(/"_next\//g, '"assets/');
    
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
  }
});

console.log(`Successfully updated paths in ${replacedCount} files.`);
