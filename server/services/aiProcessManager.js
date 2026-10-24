const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let aiProcess = null;

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8001/health', { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureAIServiceRunning() {
  const isHealthy = await checkHealth();
  if (isHealthy) {
    console.log('[AI Supervisor] Python AI service (ArcFace / FaceNet) is already running on port 8001.');
    return;
  }

  const serverDir = path.resolve(__dirname, '..');
  const scriptPath = path.join(serverDir, 'ai', 'service.py');

  console.log('[AI Supervisor] Starting Python AI service (ArcFace / FaceNet) on port 8001...');
  
  try {
    aiProcess = spawn('python', [scriptPath], {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      windowsHide: true,
    });

    aiProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[AI Service] ${msg}`);
    });

    aiProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('INFO:')) {
        console.warn(`[AI Service Warning] ${msg}`);
      }
    });

    aiProcess.on('error', (err) => {
      console.error('[AI Supervisor] Failed to launch Python AI process:', err.message);
    });

    aiProcess.on('exit', (code, signal) => {
      console.log(`[AI Supervisor] Python AI process exited with code ${code}, signal ${signal}`);
      aiProcess = null;
    });

    // Clean exit on node termination
    const cleanup = () => {
      if (aiProcess) {
        try {
          aiProcess.kill();
        } catch {}
        aiProcess = null;
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  } catch (err) {
    console.error('[AI Supervisor] Could not start AI service:', err.message);
  }
}

module.exports = { ensureAIServiceRunning, checkHealth };
