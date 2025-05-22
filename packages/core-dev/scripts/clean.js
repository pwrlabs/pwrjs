const fs = require('fs');
const path = require('path');

const corePath = path.resolve(__dirname, '..', '..', 'core');
const keepFiles = new Set(['package.json', 'README.md']);

function cleanDirectory(dir) {
    for (const item of fs.readdirSync(dir)) {
        if (keepFiles.has(item)) continue;

        const itemPath = path.join(dir, item);
        const stats = fs.lstatSync(itemPath);

        if (stats.isDirectory()) {
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`Deleted folder: ${item}`);
        } else {
            fs.unlinkSync(itemPath);
            console.log(`Deleted file: ${item}`);
        }
    }
}

cleanDirectory(corePath);
