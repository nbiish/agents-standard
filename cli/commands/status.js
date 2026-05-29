// status.js — System-wide health check / doctor
// Zero dependencies. Node.js >=16 built-ins only.

const path = require('path');
const { GLOBAL_AGENTS, GLOBAL_MCP_CATALOG, GLOBAL_SKILLS_DIR, AGENTS } = require('../lib/constants');
const { exists, isSymlinkedTo, resolveTarget, findSkills, collapseTilde } = require('../lib/fs-helpers');
const { catalogSummary, validateCatalog } = require('../lib/catalog');
const { formatJSON, formatStatus } = require('../lib/formatters');

/**
 * Run a full health check.
 * @returns {{ healthy: boolean, checks: Array, issues: Array }}
 */
function runHealthCheck() {
  const checks = [];
  const issues = [];

  // 1. AGENTS.md exists
  const agentsMdExists = exists(GLOBAL_AGENTS);
  checks.push({
    name: 'AGENTS.md',
    status: agentsMdExists ? 'ok' : 'error',
    detail: agentsMdExists ? `at ${collapseTilde(GLOBAL_AGENTS)}` : 'missing',
  });
  if (!agentsMdExists) issues.push('Global AGENTS.md not found. Run .agents rules link --all');

  // 2. MCP catalog
  const catSummary = catalogSummary();
  const catValid = validateCatalog();
  checks.push({
    name: 'MCP catalog',
    status: catSummary.exists && catValid.valid ? 'ok' : 'error',
    detail: catSummary.exists
      ? `${catSummary.serverCount} servers, ${catSummary.enabledCount} enabled`
      : 'missing',
  });
  if (!catSummary.exists) issues.push('MCP catalog not found. Run .agents setup');
  if (!catValid.valid) issues.push(`MCP catalog has issues: ${catValid.issues.join('; ')}`);

  // 3. Skills directory
  const skillsExist = exists(GLOBAL_SKILLS_DIR);
  const skills = skillsExist ? findSkills(GLOBAL_SKILLS_DIR) : [];
  checks.push({
    name: 'Skills',
    status: skillsExist ? 'ok' : 'warn',
    detail: skillsExist ? `${skills.length} skills` : 'directory missing',
  });

  // 4. Symlinks status
  let linked = 0, unlinked = 0, native = 0, nolink = 0;
  const unlinkedAgents = [];

  for (const agent of AGENTS) {
    if (agent.native) { native++; continue; }
    if (!agent.global) { nolink++; continue; }
    const target = resolveTarget(agent.global);
    if (isSymlinkedTo(target, GLOBAL_AGENTS)) {
      linked++;
    } else {
      unlinked++;
      unlinkedAgents.push(agent.name);
    }
  }

  const symlinkStatus = unlinked === 0 ? 'ok' : 'warn';
  checks.push({
    name: 'Symlinks',
    status: symlinkStatus,
    detail: `${linked}/${linked + unlinked} linked` + (unlinked > 0 ? ` (${unlinked} unlinked)` : ''),
  });

  if (unlinked > 0) {
    issues.push(`Unlinked agents: ${unlinkedAgents.join(', ')}`);
  }

  const healthy = issues.length === 0;

  return { healthy, checks, issues };
}

function run(opts = {}) {
  const { doctor, fix, json: asJson } = opts;

  if (doctor && fix) {
    const health = runHealthCheck();
    // Auto-fix: link all agents
    const { applyLinkAll } = require('./rules');
    const result = applyLinkAll();
    if (asJson) {
      console.log(formatJSON({ fixed: true, result, health }));
    } else {
      console.log(formatStatus('ok', `Auto-fixed: ${result.linked} agents linked, ${result.skipped} skipped.`));
    }
    return;
  }

  const health = runHealthCheck();

  if (asJson) {
    console.log(formatJSON(health));
  } else {
    console.log(`\n  .agents health check\n  ${'─'.repeat(40)}`);
    for (const check of health.checks) {
      console.log(`  ${formatStatus(check.status, check.name.padEnd(16) + check.detail)}`);
    }

    if (health.issues.length > 0) {
      console.log(`\n  Issues:`);
      for (const issue of health.issues) {
        console.log(`  ${formatStatus('warn', issue)}`);
      }
      console.log(`\n  Run \`.agents doctor --fix\` to auto-fix common issues.`);
    } else {
      console.log(`\n  ${formatStatus('ok', 'All systems healthy.')}`);
    }
  }

  if (!health.healthy) process.exitCode = 1;
}

module.exports = { run, runHealthCheck };
