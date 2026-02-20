const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/bg-\[#fafafa\](?! dark:bg-)/g, 'bg-[#fafafa] dark:bg-[#050505]');
    content = content.replace(/bg-white(?! dark:bg-| text-black)/g, 'bg-white dark:bg-[#0a0a0a]');
    content = content.replace(/border-black\/\[0\.06\](?! dark:border-)/g, 'border-black/[0.06] dark:border-white/[0.06]');
    content = content.replace(/border-black\/\[0\.07\](?! dark:border-)/g, 'border-black/[0.07] dark:border-white/[0.07]');
    content = content.replace(/border-black\/\[0\.05\](?! dark:border-)/g, 'border-black/[0.05] dark:border-white/[0.05]');
    content = content.replace(/bg-black\/\[0\.04\](?! dark:bg-)/g, 'bg-black/[0.04] dark:bg-white/[0.04]');
    content = content.replace(/bg-black\/\[0\.02\](?! dark:bg-)/g, 'bg-black/[0.02] dark:bg-white/[0.02]');
    content = content.replace(/bg-black\/\[0\.01\](?! dark:bg-)/g, 'bg-black/[0.01] dark:bg-white/[0.01]');
    content = content.replace(/text-black(?! dark:text-|\/|\s:)/g, 'text-black dark:text-white');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated dark layout in ${filePath}`);
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
console.log('✅ Dark Mode Layout Patch complete.');
