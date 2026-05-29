// setup.js — Bootstrap .agents/ in current project
// Zero dependencies. Node.js >=16 built-ins only.

const path = require('path');
const {
  GLOBAL_AGENTS, GLOBAL_SKILLS_DIR, PROJECT_MCP_CONFIG,
  PROJECT_AGENTS_DIR, PROJECT_SKILLS_DIR,
} = require('../lib/constants');
const { exists, ensureDirExact, writeFile, symlink, collapseTilde } = require('../lib/fs-helpers');
const { ensureCatalog } = require('../lib/catalog');
const { formatJSON, formatStatus } = require('../lib/formatters');

/**
 * Bootstrap a project with .agents/ directory.
 */
function bootstrapProject(projectDir, opts = {}) {
  const base = projectDir || process.cwd();
  const results = [];

  // 1. Create .agents/ directory
  const agentsDir = path.join(base, PROJECT_AGENTS_DIR);
  ensureDirExact(agentsDir);
  results.push({ step: 'agents_dir', path: collapseTilde(agentsDir), status: 'created' });

  // 2. Optionally create project base AGENTS.md in .agents/
  if (opts.rules !== false) {
    const baseRules = path.join(agentsDir, 'AGENTS.md');
    if (!exists(baseRules)) {
      writeFile(baseRules, [
        '# Project Base Rules',
        '# Edit this file to define static project rules (tech stack, architecture, guidelines).',
        '# These are committed to the repo and apply to ALL agents working on this project.',
        '# See https://agentsstandard.com',
        '',
        '## Tech Stack',
        '<!-- Document your tech stack here -->',
        '',
        '## Architecture',
        '<!-- Document architectural decisions -->',
        '',
        '## Guidelines',
        '<!-- Coding standards, naming conventions, etc. -->',
        '',
      ].join('\n'));
      results.push({ step: 'base_rules', path: collapseTilde(baseRules), status: 'created' });
    } else {
      results.push({ step: 'base_rules', path: collapseTilde(baseRules), status: 'exists' });
    }
  }

  // 3. Optionally create project root AGENTS.md (PRD/active rules)
  if (opts.rules !== false) {
    const activeRules = path.join(base, 'AGENTS.md');
    if (!exists(activeRules)) {
      writeFile(activeRules, [
        '# Project Active Rules',
        '# Edit this file for task-specific or feature-specific agent instructions.',
        '# This file is NOT committed by default — use for local development context.',
        '# See https://agentsstandard.com',
        '',
        '## Current Task',
        '',
        '## Active Constraints',
        '',
      ].join('\n'));
      results.push({ step: 'active_rules', path: collapseTilde(activeRules), status: 'created' });
    } else {
      results.push({ step: 'active_rules', path: collapseTilde(activeRules), status: 'exists' });
    }
  }

  // 4. Optionally create .mcp.json (project MCP config)
  if (opts.mcp !== false) {
    const mcpConfig = path.join(base, PROJECT_MCP_CONFIG);
    if (!exists(mcpConfig)) {
      writeFile(mcpConfig, JSON.stringify({ mcpServers: {} }, null, 2) + '\n');
      results.push({ step: 'mcp_config', path: collapseTilde(mcpConfig), status: 'created' });
    } else {
      results.push({ step: 'mcp_config', path: collapseTilde(mcpConfig), status: 'exists' });
    }
  }

  // 5. Optionally set up skills directory
  if (opts.skills !== false) {
    const skillsDir = path.join(agentsDir, 'skills');
    if (!exists(skillsDir)) {
      ensureDirExact(skillsDir);
      results.push({ step: 'skills_dir', path: collapseTilde(skillsDir), status: 'created' });
    } else {
      results.push({ step: 'skills_dir', path: collapseTilde(skillsDir), status: 'exists' });
    }
  }

  // 6. Ensure global catalog exists
  ensureCatalog();
  results.push({ step: 'catalog', path: collapseTilde(require('../lib/constants').GLOBAL_MCP_CATALOG), status: 'ensured' });

  return results;
}

function run(opts = {}) {
  const { quick, mcp: mcpOnly, rules: rulesOnly, skills: skillsOnly, json: asJson, project } = opts;

  let setupOpts = {};

  if (quick) {
    // Non-interactive: use all defaults
    setupOpts = { rules: true, mcp: true, skills: true };
  } else if (mcpOnly) {
    setupOpts = { rules: false, mcp: true, skills: false };
  } else if (rulesOnly) {
    setupOpts = { rules: true, mcp: false, skills: false };
  } else if (skillsOnly) {
    setupOpts = { rules: false, mcp: false, skills: true };
  } else {
    // Default: everything
    setupOpts = { rules: true, mcp: true, skills: true };
  }

  const results = bootstrapProject(project, setupOpts);

  if (asJson) {
    console.log(formatJSON({ results, projectDir: collapseTilde(project || process.cwd()) }));
  } else {
    console.log(formatStatus('ok', `Project bootstrapped at ${collapseTilde(project || process.cwd())}`));
    for (const r of results) {
      const icon = r.status === 'created' ? '+' : r.status === 'exists' ? '·' : '✓';
      console.log(`  ${icon} ${r.step}: ${r.path}`);
    }
    console.log(`\nNext: \`.agents mcp pull --all\` to add MCP servers from catalog.`);
  }
}

module.exports = { run, bootstrapProject };
