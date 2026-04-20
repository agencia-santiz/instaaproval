const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('data-theme="dark"', 'data-theme="light"');
fs.writeFileSync('index.html', html);

// 2. Map and replace layout.css
let css = fs.readFileSync('css/layout.css', 'utf8');

// Replace standard white transparents to black transparents for borders/hover effects
css = css.replace(/rgba\(255,\s*255,\s*255,\s*(0\.\d+)\)/g, 'rgba(0,0,0,$1)');

// Sidebar & Topbar Glassmorphism backgrounds
css = css.replace(/background:\s*rgba\(24,\s*24,\s*27,\s*0\.7\);/g, 'background: rgba(255, 255, 255, 0.9);\n  border-right: 1px solid rgba(0,0,0,0.08);');
css = css.replace(/background:\s*rgba\(9,\s*9,\s*11,\s*0\.8\);/g, 'background: rgba(255, 255, 255, 0.8);');

// Action Col & Calendar & Metric Cards backgrounds
css = css.replace(/background:\s*rgba\(39,\s*39,\s*42,\s*0\.6\);/g, 'background: #FFFFFF;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.05);\n  border: 1px solid rgba(0,0,0,0.08);');

// Modal Shell
css = css.replace(/background:\s*#111114;/g, 'background: #FFFFFF;\n  border: 1px solid rgba(0,0,0,0.08);\n  box-shadow: 0 20px 60px rgba(0,0,0,0.1);');

// Day Post Items (Calendar)
css = css.replace(/background:\s*rgba\(0,0,0,0\.22\);/g, 'background: rgba(0,0,0,0.03);');
css = css.replace(/background:\s*rgba\(0,0,0,0\.18\);/g, 'background: rgba(0,0,0,0.02);');

// Input backgrounds
css = css.replace(/background:\s*rgba\(0,0,0,0\.2\);/g, 'background: #FFFFFF;\n  border: 1px solid rgba(0,0,0,0.15);\n  box-shadow: 0 1px 2px rgba(0,0,0,0.05);\n  color: #111111;');

fs.writeFileSync('css/layout.css', css);

console.log('Migration to clean light theme complete.');
