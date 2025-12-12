import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirsToRemove = [
  '.next',
  'node_modules/.cache',
];

console.log('🧹 Limpando cache do Next.js...\n');

dirsToRemove.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`Removendo: ${dir}`);
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ ${dir} removido\n`);
  } else {
    console.log(`⚠️  ${dir} não encontrado\n`);
  }
});

console.log('✨ Cache limpo com sucesso!');
console.log('Execute "npm run build" para reconstruir o projeto.');
