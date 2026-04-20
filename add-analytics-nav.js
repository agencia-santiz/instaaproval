const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('id="nav-analytics"')) {
  html = html.replace('id="nav-calendario"><i data-lucide="calendar"></i> Calendário</a>', 'id="nav-calendario"><i data-lucide="calendar"></i> Calendário</a>\\n          <a class="nav-link" id="nav-analytics"><i data-lucide="bar-chart-2"></i> Analytics</a>');
  fs.writeFileSync('index.html', html.replace(/\\\\n/g, '\\n'));
  console.log('Analytics link added.');
}
