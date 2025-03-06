const ncp = require('ncp').ncp;
const path = require('path');

console.log('POST BUILD SCRIPT: Copying JAR files...');

const sourceDir = path.resolve(__dirname, '../src/services/falcon/falcon.jar'); // Adjust the source directory
const destinationDir = path.resolve(
    __dirname,
    '../lib/services/falcon/falcon.jar'
); // Adjust the destination directory

ncp(
    sourceDir,
    destinationDir,
    {
        filter: (filename) => filename.endsWith('.jar'),
    },
    (err) => {
        if (err) {
            console.error('Error copying JAR files:', err);
        } else {
            console.log('POST BUILD SCRIPT: JAR files copied successfully.');
        }
    }
);
