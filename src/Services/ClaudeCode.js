const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

module.exports = (instruction, data, jobId) => {
    const out = fs.openSync(path.join(storageDir, `${jobId}_output.log`), 'a');
    const err = fs.openSync(path.join(storageDir, `${jobId}_err.log`), 'a');

    const text = `${instruction} data: ${data}`;
    const child = spawn('claude', [
        '-p', text,
        '--dangerously-skip-permissions'
    ], {
        detached: true,
        stdio: ['ignore', out, err]
    });

    child.unref();
}