import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('src/assets');
const filesToOptimize = [
  'diagnostic_microscope_service.png',
  'education_academy_classroom_service.png',
  'health_fitness_tools_service.png',
  'healthcare_docivo_analytics_service.png',
  'personal_care_reputation_service.png'
];

async function optimizeImages() {
  for (const file of filesToOptimize) {
    const inputPath = path.join(assetsDir, file);
    const outputPath = path.join(assetsDir, file.replace('.png', '.webp'));

    if (fs.existsSync(inputPath)) {
      console.log(`Optimizing ${file}...`);
      await sharp(inputPath)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      console.log(`Created ${outputPath}, deleting original ${file}`);
      fs.unlinkSync(inputPath);
    }
  }
  console.log('Optimization complete!');
}

optimizeImages().catch(console.error);
