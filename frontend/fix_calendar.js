const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.next')) {
        filelist = walkSync(filepath, filelist);
      }
    } else if (filepath.endsWith('.tsx') || filepath.endsWith('.jsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src', 'app'));
const compFiles = walkSync(path.join(__dirname, 'src', 'components'));
const allFiles = [...files, ...compFiles];

let changedCount = 0;
allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Change min-w-[560px] to max-w-[95vw] md:min-w-[560px] to make calendar responsive
  content = content.replace(/min-w-\[560px\]/g, 'max-w-[95vw] sm:max-w-none md:min-w-[560px]');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Fixed calendar in:', file);
  }
});

console.log(`Updated ${changedCount} files with responsive calendar classes.`);
