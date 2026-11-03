// ─────────────────────────────────────────────
// SENTINEL Master Test Orchestrator & Suite Runner (Day 17)
// ─────────────────────────────────────────────
// Sequentially executes all Unit, Integration, and E2E test suites.
// Provides colored ANSI summaries, timing breakdown, and aggregated reporting.

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m',
  bgBlue: '\x1b[44m\x1b[37m',
};

// Test Suite Manifest
const TEST_MANIFEST = [
  // ── 1. Unit Tests (Pure Logic, Calibration, Schemas, Algorithms) ──
  { category: 'UNIT', file: 'tests/unit/shared-utils.test.mjs', name: 'Shared Utilities & Role Permissions' },
  { category: 'UNIT', file: 'tests/unit/validation-schemas.test.mjs', name: 'Zod Validation Schemas' },
  { category: 'UNIT', file: 'tests/unit/sensor-calibration.test.mjs', name: 'Sensor Calibration & Bound Clamping' },
  { category: 'UNIT', file: 'tests/unit/sensor-fusion.test.mjs', name: 'Multi-Sensor Fusion & Fall Detection' },
  { category: 'UNIT', file: 'tests/unit/automation-evaluator.test.mjs', name: 'Automation Condition Evaluator' },
  { category: 'UNIT', file: 'tests/unit/anomaly-detector.test.mjs', name: 'Z-Score Anomaly & Drift Estimator' },
  { category: 'UNIT', file: 'tests/unit/rate-limiter-unit.test.mjs', name: 'Sliding-Window Token Bucket Limiter' },

  // ── 2. Integration Tests (Database, Authentication, MQTT, Policy Services) ──
  { category: 'INTEGRATION', file: 'tests/integration/auth-tokens.test.mjs', name: 'Auth & JWT Family Reuse Detection' },
  { category: 'INTEGRATION', file: 'tests/integration/spatial-twin.test.mjs', name: 'Spatial Digital Twin Hierarchy' },
  { category: 'INTEGRATION', file: 'tests/integration/mqtt-telemetry-pipeline.test.mjs', name: 'MQTT Hardware Telemetry Pipeline' },
  { category: 'INTEGRATION', file: 'tests/integration/automation-alerts.test.mjs', name: 'Automation Rules & Alert Incident Lifecycle' },
  { category: 'INTEGRATION', file: 'tests/integration/compliance-policies.test.mjs', name: 'Compliance Profiles & Sector Policy Packs' },
  { category: 'INTEGRATION', file: 'tests/integration/zero-trust-security.test.mjs', name: 'Zero-Trust Security Perimeter & Sanitization' },
  { category: 'INTEGRATION', file: 'tests/integration/deployment-wizard.test.mjs', name: 'Deployment Wizard & Firmware Generator' },
  { category: 'INTEGRATION', file: 'tests/integration/production-readiness.test.mjs', name: 'Production Readiness & Health Diagnostics' },

  // ── 3. End-to-End Scenario ──
  { category: 'E2E', file: 'tests/e2e/closed-loop-scenario.test.mjs', name: 'Full Closed-Loop Operational Scenario' },
];

function printHeader() {
  console.log(`\n${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   🛡️  SENTINEL COMPREHENSIVE TEST HARNESS & SUITE ORCHESTRATOR       ${colors.reset}`);
  console.log(`${colors.dim}   Multi-Sector Safety, Compliance & Real-Time Telemetry Platform   ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

function parseTapOutput(output) {
  let passCount = 0;
  let failCount = 0;
  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('ok ') && !trimmed.includes('# SKIP') && !trimmed.includes('# TODO')) {
      passCount++;
    } else if (trimmed.startsWith('not ok ')) {
      failCount++;
    }
  }

  // Deduplicate top-level TAP suite ok
  if (passCount > 1 && failCount === 0) {
    passCount -= 1; // subtract top-level test runner suite indicator
  }

  return { passCount, failCount };
}

async function runAll() {
  const filterArg = process.argv[2]?.replace(/^--/, '').toUpperCase();

  const manifest = filterArg
    ? TEST_MANIFEST.filter((t) => t.category === filterArg || t.category.startsWith(filterArg))
    : TEST_MANIFEST;

  if (manifest.length === 0) {
    console.error(`${colors.red}No test suites found matching filter "${process.argv[2]}"${colors.reset}`);
    process.exit(1);
  }

  printHeader();

  const results = [];
  const overallStartTime = Date.now();

  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const categoryBadge =
      item.category === 'UNIT'
        ? `${colors.blue}[UNIT]       ${colors.reset}`
        : item.category === 'INTEGRATION'
        ? `${colors.magenta}[INTEGRATION]${colors.reset}`
        : `${colors.yellow}[E2E]        ${colors.reset}`;

    process.stdout.write(` ${colors.dim}[${i + 1}/${manifest.length}]${colors.reset} ${categoryBadge} ${colors.bold}${item.name.padEnd(46)}${colors.reset}`);

    const suiteStart = Date.now();
    const child = spawnSync(process.execPath, ['--test', item.file], {
      cwd: rootDir,
      encoding: 'utf-8',
      env: { ...process.env, NODE_ENV: 'test' },
    });
    const suiteDuration = Date.now() - suiteStart;

    const output = (child.stdout || '') + (child.stderr || '');
    const { passCount, failCount } = parseTapOutput(output);
    const passed = child.status === 0 && failCount === 0;

    if (passed) {
      console.log(` ${colors.green}✔ PASS${colors.reset} ${colors.dim}(${passCount} tests, ${suiteDuration}ms)${colors.reset}`);
    } else {
      console.log(` ${colors.red}✖ FAIL${colors.reset} ${colors.dim}(${suiteDuration}ms)${colors.reset}`);
      console.log(`${colors.red}------------------------------------------------------------${colors.reset}`);
      console.log(output.trim());
      console.log(`${colors.red}------------------------------------------------------------${colors.reset}`);
    }

    results.push({
      ...item,
      passed,
      passCount,
      failCount,
      durationMs: suiteDuration,
    });
  }

  const totalDuration = Date.now() - overallStartTime;
  const totalPassedSuites = results.filter((r) => r.passed).length;
  const totalFailedSuites = results.filter((r) => !r.passed).length;
  const totalPassedTests = results.reduce((acc, r) => acc + r.passCount, 0);
  const totalFailedTests = results.reduce((acc, r) => acc + r.failCount, 0);

  // ── Executive Summary Table ──
  console.log(`\n${colors.cyan}${colors.bold}──────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.bold}   TEST EXECUTION SUMMARY MATRIX${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}──────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`   ${colors.dim}Total Test Suites:${colors.reset}  ${results.length}`);
  console.log(`   ${colors.dim}Passed Suites:${colors.reset}      ${colors.green}${totalPassedSuites} passed${colors.reset}`);
  if (totalFailedSuites > 0) {
    console.log(`   ${colors.dim}Failed Suites:${colors.reset}      ${colors.red}${totalFailedSuites} failed${colors.reset}`);
  }
  console.log(`   ${colors.dim}Total Tests Run:${colors.reset}    ${totalPassedTests + totalFailedTests} assertions`);
  console.log(`   ${colors.dim}Passed Tests:${colors.reset}       ${colors.green}${totalPassedTests} passed${colors.reset}`);
  if (totalFailedTests > 0) {
    console.log(`   ${colors.dim}Failed Tests:${colors.reset}       ${colors.red}${totalFailedTests} failed${colors.reset}`);
  }
  console.log(`   ${colors.dim}Total Duration:${colors.reset}     ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`${colors.cyan}${colors.bold}──────────────────────────────────────────────────────────────────────${colors.reset}\n`);

  if (totalFailedSuites === 0) {
    console.log(` ${colors.bgGreen}${colors.bold} ALL ${results.length} TEST SUITES PASSED CLEANLY (100% SUCCESS) ${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(` ${colors.bgRed}${colors.bold} ${totalFailedSuites} TEST SUITE(S) FAILED ${colors.reset}\n`);
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error(`${colors.red}Unhandled test orchestrator error:${colors.reset}`, err);
  process.exit(1);
});

