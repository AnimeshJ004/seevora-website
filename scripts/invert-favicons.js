import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function invertFavicons() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const files = fs.readdirSync(publicDir).filter(f => f.startsWith('favicon-') && f.endsWith('.png') && !f.includes('dark'));
    
    for (const file of files) {
      const src = path.join(publicDir, file);
      const destName = file.replace('favicon-', 'favicon-dark-');
      const dest = path.join(publicDir, destName);
      
      console.log(`Processing ${file} -> ${destName}`);
      
      await sharp(src)
        .negate({ alpha: false }) // invert colors but keep transparency
        .toFile(dest);
    }
    
    console.log('Successfully generated dark theme favicons!');
  } catch (error) {
    console.error('Error generating dark favicons:', error);
  }
}

invertFavicons();
