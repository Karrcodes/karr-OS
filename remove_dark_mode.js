const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Matches ' dark:something'
    content = content.replace(/ dark:[^\s"'\`]+/g, '');
    // Matches 'dark:something '
    content = content.replace(/dark:[^\s"'\`]+ /g, '');
    // Matches 'dark:something' (if it's the only thing, or trailing)
    content = content.replace(/dark:[^\s"'\`]+/g, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Reverted dark mode classes in ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

traverseDir(srcDir);
console.log('✅ Dark Mode revert complete.');
