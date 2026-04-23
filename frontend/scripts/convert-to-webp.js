import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '../src/assets');

async function convertToWebP(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await convertToWebP(filePath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      
      console.log(`Конвертирован: ${file} → ${path.basename(webpPath)}`);
    }
  }
}

convertToWebP(assetsDir).then(() => {
  console.log('Конвертация в WebP завершена');
});
