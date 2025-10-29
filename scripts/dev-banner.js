#!/usr/bin/env node

const ports = [
  { port: '3000', service: 'Main App', url: 'http://localhost:3000', description: 'Next.js Frontend' },
  { port: '4001', service: 'TinaCMS', url: 'http://localhost:4001', description: 'Content Management' },
  { port: '3001', service: 'CMS API', url: 'http://localhost:3001', description: 'Backend API' },
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
};

console.log('\n');
console.log(`${colors.bright}${colors.green}╔════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bright}${colors.green}║                    🚀 RevampIT Development Server                     ║${colors.reset}`);
console.log(`${colors.bright}${colors.green}╚════════════════════════════════════════════════════════════════════════╝${colors.reset}`);
console.log('');
console.log(`${colors.bright}  PORT    SERVICE           URL                           DESCRIPTION${colors.reset}`);
console.log(`${colors.gray}  ────────────────────────────────────────────────────────────────────────${colors.reset}`);

ports.forEach(({ port, service, url, description }) => {
  const paddedPort = port.padEnd(6);
  const paddedService = service.padEnd(16);
  const paddedUrl = url.padEnd(28);
  console.log(`  ${colors.cyan}${paddedPort}${colors.reset}  ${colors.bright}${paddedService}${colors.reset}  ${colors.yellow}${paddedUrl}${colors.reset}  ${colors.gray}${description}${colors.reset}`);
});

console.log('');
console.log(`${colors.gray}  ────────────────────────────────────────────────────────────────────────${colors.reset}`);
console.log(`${colors.bright}${colors.green}  ✓${colors.reset} All services starting...`);
console.log('');
