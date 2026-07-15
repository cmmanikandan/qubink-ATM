import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const srcDir = process.cwd();
const destDir = 'C:\\Users\\USER\\qubink-project-build';
const localDist = path.join(srcDir, 'dist-package');

function copyDirSync(src, dest, excludeDirs = []) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) continue;
      copyDirSync(srcPath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('--- STARTING ISOLATED WIN BUILD PIPELINE (ROOT PACKAGEMANAGER BYPASS) ---');
  console.log(`Source: ${srcDir}`);
  console.log(`Target: ${destDir}`);

  // 1. Clean previous build dir
  if (fs.existsSync(destDir)) {
    console.log('Cleaning existing build directory...');
    try {
      execSync(`powershell -Command "Remove-Item -Recurse -Force '${destDir}' -ErrorAction SilentlyContinue"`);
    } catch {
      try { fs.rmSync(destDir, { recursive: true, force: true }); } catch {}
    }
  }

  // 2. Copy project files (excluding heavy build directories)
  console.log('Copying project files to isolated C: drive path...');
  copyDirSync(srcDir, destDir, ['node_modules', 'dist', 'dist-package', '.git', '.gemini']);

  // 3. Install packages in target so we have node_modules populated
  console.log('Installing npm dependencies in isolated path...');
  execSync('npm install', { cwd: destDir, stdio: 'inherit' });

  // 4. Run build
  console.log('Running Vite compile and Electron build...');
  execSync('npm run build', { cwd: destDir, stdio: 'inherit' });

  // 5. Create a dummy bin folder and compile native npm.exe AND yarn.exe shims
  console.log('Creating shims in dummy bin...');
  const binDir = path.join(destDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  // Write C# source code for native binary shim
  const csPath = path.join(destDir, 'shim.cs');
  fs.writeFileSync(
    csPath,
    `using System;
     class Program {
         static void Main() {
             Console.WriteLine("{}");
         }
     }`,
    'utf8'
  );

  // Compile shim.cs into both npm.exe and yarn.exe using the built-in Windows C# compiler csc.exe
  const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe';
  if (fs.existsSync(cscPath)) {
    console.log(`Compiling native shims using: ${cscPath}`);
    execSync(`"${cscPath}" /out:"${path.join(binDir, 'npm.exe')}" /target:exe "${csPath}"`, { stdio: 'inherit' });
    execSync(`"${cscPath}" /out:"${path.join(binDir, 'yarn.exe')}" /target:exe "${csPath}"`, { stdio: 'inherit' });
    execSync(`"${cscPath}" /out:"${path.join(binDir, 'pnpm.exe')}" /target:exe "${csPath}"`, { stdio: 'inherit' });
    console.log('Successfully compiled native shims (npm, yarn, pnpm).');
  } else {
    console.log('csc.exe not found at standard path. Creating batch files as fallback.');
    fs.writeFileSync(path.join(binDir, 'npm.cmd'), '@echo {}\r\n', 'utf8');
    fs.writeFileSync(path.join(binDir, 'yarn.cmd'), '@echo {}\r\n', 'utf8');
    fs.writeFileSync(path.join(binDir, 'pnpm.cmd'), '@echo {}\r\n', 'utf8');
  }

  // Clean up source file
  if (fs.existsSync(csPath)) fs.unlinkSync(csPath);

  // 6. Rename node_modules to vendor_modules so electron-builder doesn't scan it
  console.log('Renaming node_modules to vendor_modules to bypass NpmNodeModulesCollector...');
  const nodeModulesDir = path.join(destDir, 'node_modules');
  const vendorModulesDir = path.join(destDir, 'vendor_modules');
  if (fs.existsSync(nodeModulesDir)) {
    fs.renameSync(nodeModulesDir, vendorModulesDir);
  }

  // 7. Delete package-lock.json in target to remove any trace of lock files
  const lockPath = path.join(destDir, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log('Deleted package-lock.json');
  }

  // 8. Modify package.json in target to:
  // - Remove dependencies/devDependencies keys completely
  // - Configure files array with a FileSet mapping vendor_modules -> node_modules inside ASAR
  // - Explicitly configure packageManager at package.json root level
  // - Explicitly configure electronVersion and npmRebuild in build section
  console.log('Modifying package.json with custom configuration...');
  const targetPkgPath = path.join(destDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'));
  
  delete pkg.dependencies;
  delete pkg.devDependencies;
  
  // Set packageManager at root level of package.json
  pkg.packageManager = 'yarn@1.22.19';
  
  if (pkg.build) {
    pkg.build.electronVersion = '41.7.1';
    pkg.build.npmRebuild = false;
    pkg.build.files = [
      'dist/**/*',
      'dist-electron/**/*',
      'package.json',
      'logo.png',
      {
        'from': 'vendor_modules',
        'to': 'node_modules'
      }
    ];
  }

  fs.writeFileSync(targetPkgPath, JSON.stringify(pkg, null, 2), 'utf8');

  // 9. Package application using the overridden PATH containing our shims
  console.log('Running electron-builder package with shimmed PATH...');
  
  // Prepends binDir to existing PATH
  const separator = process.platform === 'win32' ? ';' : ':';
  const customPath = binDir + separator + (process.env.PATH || '');
  const childEnv = { ...process.env, PATH: customPath };

  execSync('npx electron-builder build --win --publish never', { 
    cwd: destDir, 
    stdio: 'inherit',
    env: childEnv
  });

  // 10. Copy setup back to workspace
  console.log('Copying finished Qubink-Nexus-Setup.exe back to workspace...');
  const buildDist = path.join(destDir, 'dist-package');
  if (!fs.existsSync(localDist)) {
    fs.mkdirSync(localDist, { recursive: true });
  }

  const files = fs.readdirSync(buildDist);
  let copied = false;
  for (const file of files) {
    if (file.endsWith('.exe')) {
      const srcFile = path.join(buildDist, file);
      const destFile = path.join(localDist, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Success! Copied installer to: ${destFile}`);
      copied = true;
    }
  }

  if (!copied) {
    throw new Error('No .exe installer was found in build output.');
  }

  console.log('--- ISOLATED BUILD PIPELINE COMPLETED SUCCESSFULLY ---');
} catch (err) {
  console.error('Isolated build failed:', err.message);
  process.exit(1);
}
