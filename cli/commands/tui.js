// tui.js — Interactive terminal dashboard (tabbed TUI)
// Full implementation coming in v2.1.0. Currently delegates to rules TUI.
// Zero dependencies. Node.js >=16 built-ins only.

const { formatStatus } = require('../lib/formatters');

function run(opts = {}) {
  // v2.0.0-alpha: delegate to rules TUI (which has the full interactive experience)
  // v2.1.0: replace with tabbed dashboard (Rules | MCP | Skills | Status)
  const rules = require('./rules');
  rules.run({ tui: true });
}

module.exports = { run };
