const fs = require('fs');
const path = require('path');

// Obtener nombre del directorio como argumento
const targetFolderArg = process.argv[2] || 'core';
const targetPath = path.resolve(__dirname, '..', targetFolderArg);

// Archivos que NO deben eliminarse
const keepFiles = new Set(['package.json', '.gitignore']);

function cleanDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`❌ Target folder "${targetFolderArg}" does not exist: ${dir}`);
        process.exit(1);
    }

    for (const item of fs.readdirSync(dir)) {
        if (keepFiles.has(item)) continue;

        const itemPath = path.join(dir, item);
        const stats = fs.lstatSync(itemPath);

        if (stats.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`🗑️  Deleted folder: ${item}`);
        } else {
            fs.unlinkSync(itemPath);
            console.log(`🗑️  Deleted file: ${item}`);
        }
    }
}

cleanDirectory(targetPath);
