/* eslint-env node */
// Auto-copies .env.example to .env if .env does not exist
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const examplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('.env file created from .env.example. Please edit it with your Firebase credentials.');
} else {
  console.log('.env file already exists.');
}
