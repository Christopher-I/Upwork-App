const { spawn } = require('child_process');

const authCode = '5aa75c356846bc7f2f4f6a4ec5c09d42';

console.log('🚀 Starting token setup with provided auth code...\n');

const proc = spawn('node', ['functions/fix-tokens-firestore.js'], {
  cwd: '/Users/chris_mac_air/work/upworkApp'
});

let output = '';

proc.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
  
  // When we see the prompt, send the auth code
  if (text.includes('Paste the authorization code here:')) {
    console.log(authCode);
    proc.stdin.write(authCode + '\n');
  }
});

proc.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

proc.on('close', (code) => {
  console.log(`\n\n✅ Process exited with code ${code}`);
  process.exit(code);
});
