import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// Helper to run commands
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

async function startDev() {
  console.log('⚡ Starting Qubink Nexus Controller dev environment...');

  // 1. Compile Electron TS files
  console.log('🔧 Compiling Electron main and preload scripts...');
  try {
    await runCommand('npx tsc -p tsconfig.electron.json');
    const distElectronDir = path.join(process.cwd(), 'dist-electron');
    if (!fs.existsSync(distElectronDir)) {
      fs.mkdirSync(distElectronDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(distElectronDir, 'package.json'),
      JSON.stringify({ type: 'commonjs' }, null, 2),
      'utf8'
    );
    console.log('✅ Electron scripts compiled and configured.');
  } catch (err) {
    console.error('❌ Failed to compile Electron scripts:', err.message);
    process.exit(1);
  }

  // 2. Start Vite Dev Server
  console.log('🚀 Launching Vite Dev Server...');
  const viteProcess = spawn('npx', ['vite'], {
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  let devServerUrl = '';

  viteProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Strip ANSI escape codes
    const cleanOutput = output.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

    // Look for local URL in Vite console output
    const match = cleanOutput.match(/Local:\s+(https?:\/\/localhost:\d+\/)/i) || 
                  cleanOutput.match(/Local:\s+(https?:\/\/127\.0\.0\.1:\d+\/)/i);
    if (match && !devServerUrl) {
      devServerUrl = match[1].trim();
      console.log(`\n🔗 Vite dev server ready at: ${devServerUrl}`);
      launchElectron(devServerUrl);
    }
  });

  viteProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite dev server exited with code ${code}`);
    process.exit(code);
  });
}

function launchElectron(serverUrl) {
  console.log('🖥️ Spawning Electron...');
  
  // Set dev server URL in environment
  const electronProcess = spawn('npx', ['electron', 'dist-electron/main.js'], {
    shell: true,
    stdio: 'inherit',
    env: { 
      ...process.env, 
      VITE_DEV_SERVER_URL: serverUrl,
      NODE_ENV: 'development'
    }
  });

  electronProcess.on('close', (code) => {
    console.log(`\n🔴 Electron exited with code ${code}. Cleaning up...`);
    process.exit(code);
  });
}

startDev();
