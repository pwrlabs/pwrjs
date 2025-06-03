const fs = require('fs');
const path = require('path');

// Obtener argumento de destino desde CLI
const targetFolderArg = process.argv[2] || 'core'; // Default: 'core'

// Paths base
const filesToCopy = ['README.md', 'package.json'];
const fromDir = path.resolve(__dirname, '..', targetFolderArg + '-dev');
const toDir = path.resolve(__dirname, '..', targetFolderArg);

filesToCopy.forEach((file) => {
    const fromPath = path.join(fromDir, file);
    const toPath = path.join(toDir, file);

    if (fs.existsSync(fromPath)) {
        fs.copyFileSync(fromPath, toPath);
        console.log(`✅ Copied ${file} to ${targetFolderArg}`);
    } else {
        console.warn(`⚠️ File not found: ${file}`);
    }
});
