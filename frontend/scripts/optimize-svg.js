import { optimize } from 'svgo';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '../src/assets');

function optimizeSvg(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      optimizeSvg(filePath);
    } else if (file.endsWith('.svg')) {
      const svg = fs.readFileSync(filePath, 'utf8');
      const result = optimize(svg, {
        path: filePath,
        multipass: true,
        plugins: [
          'preset-default',
          {
            name: 'removeViewBox',
            active: false,
          },
        ],
      });
      
      if (result.data !== svg) {
        fs.writeFileSync(filePath, result.data, 'utf8');
        console.log(`Оптимизирован: ${file}`);
      }
    }
  }
}

optimizeSvg(assetsDir);
console.log('Оптимизация SVG завершена');
