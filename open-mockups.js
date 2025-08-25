const { exec } = require('child_process');
const path = require('path');

// Open the mockup HTML file in the default browser
const mockupPath = path.join(__dirname, 'mockups', 'index.html');
const url = `file://${mockupPath}`;

console.log('Opening UI mockups in browser...');
console.log(`URL: ${url}`);

// Open in default browser
if (process.platform === 'darwin') {
    // macOS
    exec(`open "${url}"`);
} else if (process.platform === 'win32') {
    // Windows
    exec(`start "${url}"`);
} else {
    // Linux
    exec(`xdg-open "${url}"`);
}

console.log('Mockup should open in your default browser!'); 