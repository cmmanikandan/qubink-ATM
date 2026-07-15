import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Compiling Electron scripts...');
try {
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });
  
  const distElectronDir = path.join(__dirname, '../dist-electron');
  if (!fs.existsSync(distElectronDir)) {
    fs.mkdirSync(distElectronDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(distElectronDir, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2),
    'utf8'
  );
  console.log('✅ Electron scripts compiled and configured (CommonJS).');
} catch (err) {
  console.error('❌ Failed to compile Electron scripts:', err.message);
  process.exit(1);
}
