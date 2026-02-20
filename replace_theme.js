const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace color utility classes that have an optional opacity modifier
    // Uses regex standard $1 to capture the opacity group (e.g. /10)
    content = content.replace(/bg-\[#7c3aed\](\/[0-9.]+)?/g, 'bg-black$1 dark:bg-white$1');
    content = content.replace(/text-\[#7c3aed\](\/[0-9.]+)?/g, 'text-black$1 dark:text-white$1');
    content = content.replace(/border-\[#7c3aed\](\/[0-9.]+)?/g, 'border-black$1 dark:border-white$1');
    content = content.replace(/ring-\[#7c3aed\](\/[0-9.]+)?/g, 'ring-black$1 dark:ring-white$1');
    content = content.replace(/shadow-\[#7c3aed\](\/[0-9.]+)?/g, 'shadow-black$1 dark:shadow-white$1');
    content = content.replace(/accent-\[#7c3aed\](\/[0-9.]+)?/g, 'accent-black$1 dark:accent-white$1');

    // Hover background replacements
    content = content.replace(/hover:bg-\[#6d28d9\]/g, 'hover:bg-neutral-800 dark:hover:bg-neutral-200');
    // Raw base colour replacements (e.g. if passed as a string prop to a component like Progress bar color="#7c3aed")
    content = content.replace(/color="#7c3aed"/g, 'color="#000000"');
    content = content.replace(/color: '#7c3aed'/g, "color: '#000000'");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated theme in ${filePath}`);
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
console.log('✅ Theme replacement complete.');
