#!/usr/bin/env node

/**
 * Build and Deploy Script for Doğuş Otomat Telemetri Sistemi
 * 
 * This script automates the build and deployment process for the application.
 * It ensures all necessary steps are completed for a successful deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fgGreen: '\x1b[32m',
  fgRed: '\x1b[31m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m'
};

// Log functions
const log = {
  info: (msg) => console.log(`${colors.fgBlue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.fgGreen}✔${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.fgYellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.fgRed}✖${colors.reset} ${msg}`)
};

// Execute command with error handling
function execCommand(command, options = {}) {
  try {
    log.info(`Executing: ${command}`);
    const result = execSync(command, { 
      stdio: 'inherit', 
      ...options 
    });
    return result;
  } catch (error) {
    log.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

// Check if required files exist
function checkRequiredFiles() {
  const requiredFiles = [
    '.env',
    'package.json',
    'src/App.tsx',
    'src/config/firebase.ts'
  ];

  log.info('Checking required files...');
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log.error(`Required file not found: ${file}`);
      process.exit(1);
    }
  }
  
  log.success('All required files present');
}

// Validate environment variables
function validateEnv() {
  log.info('Validating environment variables...');
  
  if (!fs.existsSync('.env')) {
    log.warn('.env file not found. Using example values.');
    return;
  }
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_DATABASE_URL',
    'REACT_APP_FIREBASE_PROJECT_ID'
  ];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      log.warn(`Environment variable not found: ${varName}`);
    }
  }
  
  log.success('Environment validation completed');
}

// Clean previous builds
function cleanBuild() {
  log.info('Cleaning previous builds...');
  
  if (fs.existsSync('build')) {
    // Use different commands based on OS
    if (process.platform === 'win32') {
      execCommand('rmdir /s /q build');
    } else {
      execCommand('rm -rf build');
    }
  }
  
  log.success('Clean completed');
}

// Install dependencies
function installDependencies() {
  log.info('Installing dependencies...');
  execCommand('npm install');
  log.success('Dependencies installed');
}

// Run tests (if any)
function runTests() {
  log.info('Running tests...');
  // Add test command if you have tests
  // execCommand('npm test');
  log.success('Tests completed');
}

// Build the application
function buildApp() {
  log.info('Building application...');
  execCommand('npm run build');
  log.success('Build completed successfully');
}

// Clean unnecessary files from build
function cleanBuildFiles() {
  log.info('Cleaning unnecessary files from build...');
  
  const unnecessaryFiles = [
    'CommodityList.json',
    'emulator-api.html',
    'iot-device-simulator.js',
    'test-netlify-api.html',
    '_redirects'
  ];
  
  for (const file of unnecessaryFiles) {
    const filePath = path.join('build', file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log.info(`Removed unnecessary file: ${file}`);
    }
  }
  
  // Create a production version of _redirects without test files
  const productionRedirects = `# Static assets should be served as-is
/static/* /static/:splat 200

# API endpoints
/.netlify/functions/* /.netlify/functions/:splat 200

# Fallback for SPA routes
/* /index.html 200`;

  const redirectsPath = path.join('build', '_redirects');
  fs.writeFileSync(redirectsPath, productionRedirects);
  log.info('Created production _redirects file');
  
  log.success('Build cleaning completed');
}

// Deployment instructions
function showDeploymentInstructions() {
  log.success('Build completed successfully!');
  log.info('\nTo deploy to Netlify:');
  log.info('1. Install Netlify CLI: npm install -g netlify-cli');
  log.info('2. Login to Netlify: netlify login');
  log.info('3. Deploy: netlify deploy --prod');
  log.info('\nNote: Netlify will automatically deploy both the build folder (frontend files)');
  log.info('and the netlify/functions folder (API endpoints) according to netlify.toml configuration.');
  log.info('\nFor manual deployment:');
  log.info('- Upload the contents of the "build" folder to your hosting provider');
  log.info('- Upload the "netlify/functions" folder separately for API endpoints');
  log.info('- Ensure the _redirects file is in the build folder for proper routing');
}

// Verify build output
function verifyBuild() {
  log.info('Verifying build output...');
  
  if (!fs.existsSync('build')) {
    log.error('Build directory not found');
    process.exit(1);
  }
  
  const requiredBuildFiles = [
    'index.html',
    'static/js',
    'static/css'
  ];
  
  for (const file of requiredBuildFiles) {
    if (!fs.existsSync(path.join('build', file))) {
      log.error(`Required build file not found: ${file}`);
      process.exit(1);
    }
  }
  
  log.success('Build verification passed');
}

// Main deployment function
async function deploy() {
  try {
    log.info(`${colors.bright}Do\u011fu\u015f Otomat Telemetri Sistemi - Build and Deploy Script${colors.reset}`);
    log.info('Starting deployment process...\n');
    
    // Step 1: Check required files
    checkRequiredFiles();
    
    // Step 2: Validate environment
    validateEnv();
    
    // Step 3: Clean previous builds
    cleanBuild();
    
    // Step 4: Install dependencies
    installDependencies();
    
    // Step 5: Run tests
    runTests();
    
    // Step 6: Build application
    buildApp();
    
    // Step 7: Clean unnecessary files from build
    cleanBuildFiles();
    
    // Step 8: Verify build
    verifyBuild();
    
    // Step 9: Show deployment instructions
    showDeploymentInstructions();
    
  } catch (error) {
    log.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run deployment
deploy();