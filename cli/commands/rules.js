// rules.js — AGENTS.md management: symlinks, depth, path, TUI
// Extracted from v1.4.0 CLI. Zero dependencies. Node.js >=16 built-ins only.

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const {
  AGENTS, GLOBAL_AGENTS, GLOBAL_AGENTS_DIR, DEPTH_ENV, PATH_ENV, DEFAULT_DEPTH,
  SHELL_PROFILE_FILES, isNativeAgent, hasGlobalConfig,
} = require('../lib/constants');
const {
  HOME, expandTilde, collapseTilde, resolveTarget, ensureDir,
  isSymlinkedTo, isDirectory, exists, symlink, unlinkIf,
} = require('../lib/fs-helpers');
const { formatJSON, formatTable, formatStatus, renderOutput } = require('../lib/formatters');

// ── State ────────────────────────────────────────────────────────────────────

let cursorIdx = 0;
let agentStates = [];    // { agent, target, isLinked }
let depth = DEFAULT_DEPTH;
let globalPath = GLOBAL_AGENTS;
let message = '';

// ── Helpers ──────────────────────────────────────────────────────────────────

function agentLabel(agent) {
  if (isNativeAgent(agent.key)) return 'native (no symlink needed)';
  if (!agent.global) return agent.note || 'project-only or UI-based';
  return collapseTilde(agent.global);
}

// ── Agent state initialization ───────────────────────────────────────────────

function initAgentStates() {
  // Read AGENTS_DEPTH from env
  const envDepth = parseInt(process.env.AGENTS_DEPTH, 10);
  if (envDepth >= 1 && envDepth <= 10) {
    depth = envDepth;
  }

  // Read AGENTS_PATH from env
  const envPath = process.env.AGENTS_PATH;
  if (envPath) {
    globalPath = expandTilde(envPath);
  }

  agentStates = AGENTS.map(agent => {
    const target = agent.global ? resolveTarget(agent.global) : null;
    const isLinked = target ? isSymlinkedTo(target, globalPath) : false;
    return { agent, target, isLinked };
  });
}

// ── Headless Actions ─────────────────────────────────────────────────────────

function applyLinkAll() {
  let linked = 0, unlinked = 0, skipped = 0;

  for (const s of agentStates) {
    if (!s.agent.global || isNativeAgent(s.agent.key)) {
      skipped++;
      continue;
    }

    const target = resolveTarget(s.agent.global);

    // Create global AGENTS.md if it doesn't exist
    if (!exists(globalPath)) {
      ensureDir(globalPath);
      fs.writeFileSync(globalPath, [
        '# Global Agent Rules',
        '# Edit this file to configure behavior for ALL agents.',
        '# See https://agentsstandard.com',
        '',
        '## Identity',
        'You are a senior engineer.',
        '',
        '## Safety',
        '- Never hardcode secrets',
        '- Validate all inputs',
        '- Use parameterized queries',
        '',
      ].join('\n'), 'utf-8');
    }

    ensureDir(target);
    try {
      // Remove existing file/symlink if present
      if (exists(target)) {
        fs.unlinkSync(target);
      }
      fs.symlinkSync(globalPath, target);
      linked++;
    } catch (err) {
      return { linked, unlinked, skipped, error: `Failed to link ${s.agent.name}: ${err.message}` };
    }
  }

  // Set AGENTS_DEPTH in shell profile
  writeDepthToProfiles(depth);

  return { linked, unlinked, skipped, error: null };
}

function applyUnlinkAll() {
  let unlinked = 0, skipped = 0;

  for (const s of agentStates) {
    if (!s.agent.global || isNativeAgent(s.agent.key)) {
      skipped++;
      continue;
    }

    const target = resolveTarget(s.agent.global);
    if (unlinkIf(target, globalPath)) {
      unlinked++;
    }
  }

  return { unlinked, skipped };
}

function writeDepthToProfiles(d) {
  const depthLine = `export AGENTS_DEPTH=${d}   # agents-standard`;
  for (const pf of SHELL_PROFILE_FILES) {
    try {
      if (exists(pf)) {
        let content = fs.readFileSync(pf, 'utf-8');
        if (content.includes('AGENTS_DEPTH')) {
          content = content.replace(/export AGENTS_DEPTH=.*/g, depthLine);
        } else {
          content += `\n${depthLine}\n`;
        }
        fs.writeFileSync(pf, content, 'utf-8');
      }
    } catch { /* skip unwritable profiles */ }
  }
}

// ── Headless List ────────────────────────────────────────────────────────────

function listRules() {
  initAgentStates();
  return agentStates.map(s => ({
    key: s.agent.key,
    name: s.agent.name,
    status: isNativeAgent(s.agent.key) ? 'native' :
            !s.agent.global ? 'n/a' :
            s.isLinked ? 'linked' : 'unlinked',
    target: agentLabel(s.agent),
  }));
}

// ── TUI Rendering ────────────────────────────────────────────────────────────

function hideCursor() { process.stdout.write('\x1b[?25l'); }
function showCursor() { process.stdout.write('\x1b[?25h'); }
function clearScreen() { process.stdout.write('\x1b[2J\x1b[H'); }
function moveTo(row, col) { process.stdout.write(`\x1b[${row};${col}H`); }

const C = {
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
  bold:    '\x1b[1m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  invert:  '\x1b[7m',
  hide:    '\x1b[8m',
};

function depthDesc(d) {
  if (d <= 1) return 'global only';
  if (d === 2) return 'global + project';
  if (d === 3) return 'global + project + folder (default)';
  return `global + project + ${d - 2} intermediate dirs`;
}

function render() {
  clearScreen();

  // Header
  process.stdout.write(`${C.bold}${C.cyan}  agents-standard${C.reset}  ${C.dim}rules v2.0.0${C.reset}\n`);
  process.stdout.write(`  ${C.dim}Global:${C.reset} ${collapseTilde(globalPath)}\n`);
  process.stdout.write(`  ${C.dim}Depth:${C.reset}  ${C.yellow}${depth}${C.reset} (${depthDesc(depth)})\n`);
  process.stdout.write(`  ${C.dim}────────────────────────────────────────────────────${C.reset}\n\n`);

  // Column headers
  process.stdout.write(`  ${C.dim}${'Status'.padEnd(8)} ${'Agent'.padEnd(22)} Target${C.reset}\n`);
  process.stdout.write(`  ${C.dim}──────  ─────────────────────  ──────────────────────────────────────────${C.reset}\n`);

  // Agent list
  const rows = process.stdout.rows || 24;
  const pageSize = Math.max(1, rows - 10);
  const startIdx = Math.max(0, cursorIdx - Math.floor(pageSize / 2));
  const endIdx = Math.min(agentStates.length, startIdx + pageSize);

  for (let i = startIdx; i < endIdx; i++) {
    const s = agentStates[i];
    const isCursor = i === cursorIdx;
    const prefix = isCursor ? ` ${C.invert}` : '  ';
    const suffix = isCursor ? C.reset : '';

    let status;
    if (isNativeAgent(s.agent.key)) {
      status = `${C.green}● native${C.reset}`;
    } else if (!s.agent.global) {
      status = `${C.dim}· n/a${C.reset}`;
    } else if (s.isLinked) {
      status = `${C.green}● linked${C.reset}`;
    } else {
      status = `${C.dim}○ unlinked${C.reset}`;
    }

    const name = s.agent.name.padEnd(22);
    const target = agentLabel(s.agent);

    process.stdout.write(`${prefix}${status}  ${name}${target}${suffix}\n`);
  }

  // Spacer
  process.stdout.write('\n');

  // Bottom bar — Submit
  const barY = rows - 2;
  moveTo(barY, 1);
  const isApply = cursorIdx === agentStates.length;
  if (isApply) {
    process.stdout.write(`${C.invert}  Submit changes  ${C.reset} ${C.green}← press Enter${C.reset}`);
  } else {
    process.stdout.write(`${C.dim}  Submit changes  ← navigate here and press Enter${C.reset}`);
  }

  // Message line
  moveTo(barY + 1, 1);
  if (message) {
    process.stdout.write(`${C.yellow}  ${message}${C.reset}`);
  } else {
    process.stdout.write(`  ${C.dim}↑↓ navigate  space toggle  enter submit  q quit  d depth  g global path${C.reset}`);
  }

  moveTo(barY + 2, 1);
}

// ── TUI Actions ──────────────────────────────────────────────────────────────

function toggleAgent() {
  const s = agentStates[cursorIdx];
  if (!s.agent.global || isNativeAgent(s.agent.key)) return;
  s.isLinked = !s.isLinked;
}

function applyChanges() {
  let linked = 0, unlinked = 0, skipped = 0;

  for (const s of agentStates) {
    if (!s.agent.global || isNativeAgent(s.agent.key)) {
      skipped++;
      continue;
    }

    const target = resolveTarget(s.agent.global);

    if (s.isLinked) {
      // Create global AGENTS.md if it doesn't exist
      if (!exists(globalPath)) {
        ensureDir(globalPath);
        fs.writeFileSync(globalPath, [
          '# Global Agent Rules',
          '# Edit this file to configure behavior for ALL agents.',
          '# See https://agentsstandard.com',
          '',
          '## Identity',
          'You are a senior engineer.',
          '',
          '## Safety',
          '- Never hardcode secrets',
          '- Validate all inputs',
          '- Use parameterized queries',
          '',
        ].join('\n'), 'utf-8');
      }

      ensureDir(target);
      try {
        // Remove existing file/symlink if present
        if (exists(target)) {
          fs.unlinkSync(target);
        }
        fs.symlinkSync(globalPath, target);
        linked++;
      } catch (err) {
        message = `Failed to link ${s.agent.name}: ${err.message}`;
        return;
      }
    } else {
      // Remove symlink if it points to our global AGENTS.md
      if (unlinkIf(target, globalPath)) {
        unlinked++;
      }
    }
  }

  // Set AGENTS_DEPTH in shell profile
  writeDepthToProfiles(depth);

  message = `Applied: ${linked} linked, ${unlinked} unlinked, ${skipped} skipped. AGENTS_DEPTH=${depth}. Restart your shell.`;
}

function cycleDepth() {
  depth = depth >= 5 ? 1 : depth + 1;
}

function promptGlobalPath() {
  message = 'Enter global AGENTS.md path (esc to cancel): ';
  render();

  // Simple input mode
  process.stdin.setRawMode(false);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('', (answer) => {
    rl.close();
    const trimmed = answer.trim();
    if (trimmed && trimmed !== '\x1b') {
      if (trimmed.startsWith('~/') || trimmed.startsWith('~')) {
        globalPath = expandTilde(trimmed);
      } else if (trimmed.startsWith('/')) {
        globalPath = trimmed;
      }
      // Re-check symlink status for all agents with new global path
      for (const s of agentStates) {
        if (s.agent.global && !isNativeAgent(s.agent.key)) {
          s.isLinked = isSymlinkedTo(resolveTarget(s.agent.global), globalPath);
        }
      }
    }
    message = '';
    process.stdin.setRawMode(true);
    render();
  });
}

// ── TUI Input ────────────────────────────────────────────────────────────────

function handleInput(key) {
  if (key.name === 'q') {
    showCursor();
    process.stdout.write('\n');
    process.exit(0);
  }

  if (key.name === 'up' || key.name === 'k') {
    cursorIdx = Math.max(0, cursorIdx - 1);
    message = '';
  } else if (key.name === 'down' || key.name === 'j') {
    cursorIdx = Math.min(agentStates.length, cursorIdx + 1);
    message = '';
  } else if (key.name === 'space') {
    if (cursorIdx < agentStates.length) {
      toggleAgent();
    }
    message = '';
  } else if (key.name === 'return') {
    if (cursorIdx === agentStates.length) {
      applyChanges();
    }
  } else if (key.name === 'd') {
    cycleDepth();
    message = '';
  } else if (key.name === 'g') {
    promptGlobalPath();
    return; // promptGlobalPath handles render
  }

  render();
}

// ── TUI Entry ────────────────────────────────────────────────────────────────

function runTUI() {
  initAgentStates();

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('Interactive TUI requires a TTY. Use --json or --list flags.');
    process.exit(1);
  }

  readline.emitKeypressEvents(process.stdin);
  hideCursor();
  render();

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('keypress', (str, key) => {
    if (!key) return;
    if (key.ctrl && key.name === 'c') {
      showCursor();
      process.stdout.write('\n');
      process.exit(0);
    }
    handleInput(key);
  });

  process.on('exit', () => {
    showCursor();
    process.stdout.write('\n');
  });
}

// ── Headless Entry ───────────────────────────────────────────────────────────

function runHeadless({ subcommand, asJson, json, depth: newDepth, path: newPath }) {
  const useJson = asJson || json;
  initAgentStates();

  switch (subcommand) {
    case 'list': {
      const rules = listRules();
      if (useJson) {
        console.log(formatJSON(rules));
      } else {
        console.log(formatTable(rules, ['status', 'name', 'target'], {
          headers: ['STATUS', 'AGENT', 'TARGET'],
        }));
      }
      break;
    }
    case 'link': {
      // --all is implied for headless
      const result = applyLinkAll();
      if (result.error) {
        console.error(result.error);
        process.exit(1);
      }
      if (useJson) {
        console.log(formatJSON(result));
      } else {
        console.log(`Linked: ${result.linked}, Unlinked: ${result.unlinked}, Skipped: ${result.skipped}`);
        console.log(formatStatus('ok', 'Rule symlinks applied. Restart your shell.'));
      }
      break;
    }
    case 'unlink': {
      const result = applyUnlinkAll();
      if (useJson) {
        console.log(formatJSON(result));
      } else {
        console.log(`Unlinked: ${result.unlinked}, Skipped: ${result.skipped}`);
        console.log(formatStatus('ok', 'Rule symlinks removed.'));
      }
      break;
    }
    case 'depth': {
      if (newDepth !== undefined) {
        depth = parseInt(newDepth, 10);
        if (depth < 1 || depth > 10) {
          console.error('Depth must be between 1 and 10');
          process.exit(1);
        }
        writeDepthToProfiles(depth);
        process.env[require('../lib/constants').DEPTH_ENV] = String(depth);
      }
      if (useJson) {
        console.log(formatJSON({ depth }));
      } else {
        console.log(`AGENTS_DEPTH=${depth} (${depthDesc(depth)})`);
      }
      break;
    }
    case 'path': {
      if (newPath) {
        globalPath = resolveTarget(newPath);
        process.env[require('../lib/constants').PATH_ENV] = globalPath;
      }
      if (useJson) {
        console.log(formatJSON({ path: collapseTilde(globalPath) }));
      } else {
        console.log(`AGENTS_PATH=${collapseTilde(globalPath)}`);
      }
      break;
    }
    default:
      // Default: list
      const rules = listRules();
      if (useJson) {
        console.log(formatJSON(rules));
      } else {
        console.log(formatTable(rules, ['status', 'name', 'target'], {
          headers: ['STATUS', 'AGENT', 'TARGET'],
        }));
      }
  }
}

/**
 * Main entry point for the rules command.
 * @param {object} opts
 * @param {string} [opts.subcommand] — list, link, unlink, depth, path
 * @param {boolean} [opts.json] — output as JSON
 * @param {number|string} [opts.depth] — set AGENTS_DEPTH
 * @param {string} [opts.path] — set AGENTS_PATH
 */
function run(opts = {}) {
  if (opts.tui === true || (!opts.subcommand && process.stdin.isTTY)) {
    runTUI();
  } else {
    runHeadless(opts);
  }
}

module.exports = { run, listRules, applyLinkAll, applyUnlinkAll, initAgentStates };
