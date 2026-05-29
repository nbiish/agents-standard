// mcp.js — MCP server catalog and project configuration management
// Zero dependencies. Node.js >=16 built-ins only.

const path = require('path');
const { GLOBAL_MCP_CATALOG, PROJECT_MCP_CONFIG, MCP_FORMATS, AGENTS_BY_KEY } = require('../lib/constants');
const { exists, readFile, writeFile, ensureDir, collapseTilde } = require('../lib/fs-helpers');
const {
  readCatalog, writeCatalog, listServersDetailed, getServer,
  addServer, removeServer, toggleServer, setServerEnabled,
  validateCatalog, catalogSummary, ensureCatalog,
} = require('../lib/catalog');
const { substituteEnvVars, checkEnvVars, requiredEnvVars } = require('../lib/env-var');
const { formatJSON, formatTable, formatStatus, formatSection } = require('../lib/formatters');

// ── Project MCP Config ───────────────────────────────────────────────────────

/**
 * Read the project's .mcp.json config.
 * @param {string} [projectDir] — project root (defaults to cwd)
 * @returns {{ servers: object, filePath: string }|null}
 */
function readProjectMcp(projectDir) {
  const base = projectDir || process.cwd();
  const filePath = path.join(base, PROJECT_MCP_CONFIG);

  if (!exists(filePath)) return { servers: {}, filePath };

  const raw = readFile(filePath);
  if (!raw) return { servers: {}, filePath };

  try {
    const parsed = JSON.parse(raw);
    return { servers: parsed.mcpServers || {}, filePath };
  } catch {
    return { servers: {}, filePath };
  }
}

/**
 * Write the project's .mcp.json config.
 */
function writeProjectMcp(servers, projectDir) {
  const base = projectDir || process.cwd();
  const filePath = path.join(base, PROJECT_MCP_CONFIG);
  writeFile(filePath, JSON.stringify({ mcpServers: servers }, null, 2) + '\n');
  return filePath;
}

/**
 * Add a server to the project .mcp.json.
 */
function addToProject(name, serverDef, projectDir) {
  const { servers, filePath } = readProjectMcp(projectDir);
  servers[name] = serverDef;
  writeProjectMcp(servers, projectDir);
  return filePath;
}

/**
 * Remove a server from the project .mcp.json.
 */
function removeFromProject(name, projectDir) {
  const { servers, filePath } = readProjectMcp(projectDir);
  if (!servers[name]) return false;
  delete servers[name];
  writeProjectMcp(servers, projectDir);
  return true;
}

// ── MCP Commands ─────────────────────────────────────────────────────────────

function cmdCatalog(args, asJson) {
  const sub = args[0];

  switch (sub) {
    case 'toggle': {
      const name = args[1];
      if (!name) {
        console.error('Usage: .agents mcp catalog toggle <name>');
        process.exit(1);
      }
      const result = toggleServer(name);
      if (result === null) { console.error(`Server "${name}" not found in catalog.`); process.exit(1); }
      if (asJson) {
        console.log(formatJSON({ name, disabled: result }));
      } else {
        console.log(formatStatus('ok', `Server "${name}" ${result ? 'disabled' : 'enabled'}.`));
      }
      break;
    }
    case 'add': {
      const name = args[1];
      if (!name) { console.error('Usage: .agents mcp catalog add <name>'); process.exit(1); }
      // Interactive add would be done in TUI; headless requires JSON input
      console.log(formatStatus('info', 'Use .agents mcp catalog add interactively in the TUI (coming in v2.1.0).'));
      console.log('For now, edit ~/.agents/mcp-settings.json directly.');
      break;
    }
    case 'remove': {
      const name = args[1];
      if (!name) { console.error('Usage: .agents mcp catalog remove <name>'); process.exit(1); }
      const removed = removeServer(name);
      if (!removed) { console.error(`Server "${name}" not found in catalog.`); process.exit(1); }
      if (asJson) {
        console.log(formatJSON({ name, removed: true }));
      } else {
        console.log(formatStatus('ok', `Server "${name}" removed from catalog.`));
      }
      break;
    }
    default: {
      // catalog list (default)
      const servers = listServersDetailed();
      if (asJson) {
        console.log(formatJSON({ servers, summary: catalogSummary() }));
      } else {
        const summary = catalogSummary();
        if (!summary.exists) {
          console.log(formatStatus('warn', 'Catalog not found. Run .agents setup to create it.'));
          return;
        }
        console.log(`Catalog: ${collapseTilde(GLOBAL_MCP_CATALOG)}`);
        console.log(`Servers: ${summary.serverCount} (${summary.enabledCount} enabled, ${summary.disabledCount} disabled)\n`);
        const rows = servers.map(s => ({
          status: s.disabled ? ' · off' : ' ✓ on',
          name: s.name,
          type: s.type || s.command ? 'stdio' : s.url ? 'http' : '?',
          description: s.description || '',
        }));
        console.log(formatTable(rows, ['status', 'name', 'type', 'description'], {
          headers: ['STATUS', 'NAME', 'TYPE', 'DESCRIPTION'],
        }));
      }
    }
  }
}

function cmdProject(args, asJson) {
  const { servers, filePath } = readProjectMcp();
  const names = Object.keys(servers);

  if (asJson) {
    console.log(formatJSON({ filePath: collapseTilde(filePath), servers, count: names.length }));
  } else {
    if (names.length === 0) {
      console.log(formatStatus('info', `No servers in ${collapseTilde(filePath)}`));
      console.log(`Run \`.agents mcp pull <name>\` to pull servers from the catalog.`);
      return;
    }
    console.log(`Project MCP config: ${collapseTilde(filePath)}`);
    console.log(`Servers: ${names.length}\n`);
    const rows = names.map(name => ({
      status: servers[name].disabled ? ' · off' : ' ✓ on',
      name,
      type: servers[name].type || (servers[name].command ? 'stdio' : 'http'),
      description: servers[name].description || '',
    }));
    console.log(formatTable(rows, ['status', 'name', 'type', 'description'], {
      headers: ['STATUS', 'NAME', 'TYPE', 'DESCRIPTION'],
    }));
  }
}

function cmdPull(args, asJson) {
  const name = args[0];

  if (name === '--all') {
    // Pull all enabled servers from catalog
    const servers = listServersDetailed();
    const enabled = servers.filter(s => !s.isDisabled);
    const results = [];
    for (const server of enabled) {
      const sanitized = substituteEnvVars(server);
      addToProject(server.name, sanitized);
      results.push({ name: server.name, pulled: true });
    }
    if (asJson) {
      console.log(formatJSON({ pulled: results }));
    } else {
      console.log(formatStatus('ok', `Pulled ${results.length} servers into project .mcp.json`));
      for (const r of results) {
        console.log(`  ✓ ${r.name}`);
      }
    }
    return;
  }

  if (!name) {
    console.error('Usage: .agents mcp pull <name> | --all');
    process.exit(1);
  }

  const serverDef = getServer(name);
  if (!serverDef) {
    console.error(`Server "${name}" not found in catalog.`);
    process.exit(1);
  }

  const sanitized = substituteEnvVars(serverDef);
  const filePath = addToProject(name, sanitized);

  if (asJson) {
    console.log(formatJSON({ name, pulled: true, filePath: collapseTilde(filePath), envVars: requiredEnvVars(serverDef) }));
  } else {
    console.log(formatStatus('ok', `Pulled "${name}" into ${collapseTilde(filePath)}`));
    const envVars = requiredEnvVars(serverDef);
    if (envVars.length > 0) {
      console.log(`  Env vars needed: ${envVars.join(', ')}`);
    }
    console.log(`  ${'─'.repeat(40)}`);
    console.log(`  API keys have been replaced with \${ENV_VAR} references.`);
    console.log(`  Set the env vars above in your shell profile.`);
  }
}

function cmdPush(args, asJson) {
  const name = args[0];
  if (!name) {
    console.error('Usage: .agents mcp push <name>');
    process.exit(1);
  }

  const removed = removeFromProject(name);
  if (!removed) {
    console.error(`Server "${name}" not found in project .mcp.json.`);
    process.exit(1);
  }

  if (asJson) {
    console.log(formatJSON({ name, removed: true }));
  } else {
    console.log(formatStatus('ok', `Removed "${name}" from project .mcp.json`));
  }
}

function cmdHealth(asJson) {
  const servers = listServersDetailed();
  const results = [];

  for (const server of servers) {
    const envCheck = checkEnvVars(server);
    results.push({
      name: server.name,
      enabled: !server.isDisabled,
      envVarsOk: envCheck.allSet,
      missingEnvVars: envCheck.missing,
    });
  }

  if (asJson) {
    console.log(formatJSON({ servers: results }));
  } else {
    const healthy = results.filter(r => r.enabled && r.envVarsOk);
    const unhealthy = results.filter(r => r.enabled && !r.envVarsOk);
    const disabled = results.filter(r => !r.enabled);

    console.log(formatSection('MCP Health Check'));
    console.log(`  Enabled & healthy: ${healthy.length}`);
    console.log(`  Enabled & missing env: ${unhealthy.length}`);
    console.log(`  Disabled: ${disabled.length}\n`);

    if (unhealthy.length > 0) {
      console.log('Servers with missing environment variables:');
      for (const s of unhealthy) {
        console.log(`  ${formatStatus('warn', s.name)} — missing: ${s.missingEnvVars.join(', ')}`);
      }
    }

    if (healthy.length > 0) {
      console.log('\nHealthy servers:');
      for (const s of healthy) {
        console.log(`  ${formatStatus('ok', s.name)}`);
      }
    }
  }
}

function cmdFind(args, asJson) {
  const query = args[0];
  if (!query) {
    console.error('Usage: .agents mcp find <query>');
    process.exit(1);
  }

  // Search local catalog first
  const servers = listServersDetailed();
  const matches = servers.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
    (s.tags && s.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
  );

  if (asJson) {
    console.log(formatJSON({ query, matches, count: matches.length }));
  } else {
    if (matches.length === 0) {
      console.log(formatStatus('info', `No local servers match "${query}".`));
      console.log('Try searching online registries (coming in v2.1.0).');
      return;
    }
    console.log(`Found ${matches.length} server(s) matching "${query}":\n`);
    const rows = matches.map(s => ({
      status: s.disabled ? ' · off' : ' ✓ on',
      name: s.name,
      description: s.description || '',
    }));
    console.log(formatTable(rows, ['status', 'name', 'description'], {
      headers: ['STATUS', 'NAME', 'DESCRIPTION'],
    }));
  }
}

/**
 * Main entry point for the mcp command.
 * @param {object} opts
 * @param {string} [opts.subcommand] — catalog, project, pull, push, health, find
 * @param {string[]} [opts.args] — positional arguments
 * @param {boolean} [opts.json] — output as JSON
 */
function run(opts = {}) {
  const { subcommand, args = [], json: asJson = false } = opts;

  // Ensure catalog exists before any operations
  ensureCatalog();

  switch (subcommand) {
    case 'catalog':
      cmdCatalog(args, asJson);
      break;
    case 'project':
      cmdProject(args, asJson);
      break;
    case 'pull':
      cmdPull(args, asJson);
      break;
    case 'push':
      cmdPush(args, asJson);
      break;
    case 'health':
      cmdHealth(asJson);
      break;
    case 'find':
      cmdFind(args, asJson);
      break;
    default:
      if (asJson) {
        cmdCatalog([], true);
      } else {
        console.log('Usage: .agents mcp {catalog|project|pull|push|health|find}');
        console.log('  catalog       List/manage global MCP server catalog');
        console.log('  project       List servers in project .mcp.json');
        console.log('  pull <name>   Pull a server from catalog into project');
        console.log('  push <name>   Remove a server from project config');
        console.log('  health        Check server environment variables');
        console.log('  find <query>  Search for MCP servers');
      }
  }
}

module.exports = { run, readProjectMcp, writeProjectMcp, addToProject, removeFromProject };
