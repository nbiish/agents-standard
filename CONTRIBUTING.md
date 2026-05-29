# Contributing to Agents Standard

**Open standard, open contribution.** Humans, AI agents, tool creators, and providers — everyone can contribute to keeping the AGENTS.md standard and `.agents` CLI up to date.

---

## Quick Reference

| What you want to do | How |
|--------------------|-----|
| Add a new agent to the registry | Edit `agents.json` — see [Agent Registry](#agent-registry-agentsjson) |
| Add/update an MCP server in the catalog | Submit a catalog entry — see [MCP Catalog](#mcp-catalog-mcp-settingsjson) |
| Add/update an LLM provider | Edit `providers.json` — see [LLM Providers](#llm-providers-providersjson) |
| Fix a CLI bug or add a feature | See [CLI Development](#cli-development) |
| Update the website content | See [Website](#website) |
| Propose a spec change | Open a [spec change issue](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=spec-change.md) |

---

## For Everyone: The Open-Code Model

This standard lives through community contributions. The process is designed so that **both humans and AI agents** can contribute. An AI agent acting on behalf of a user or provider can submit the exact same PR as a human would.

### The Golden Rule

**Every change to `agents.json` or `providers.json` must include a link to official documentation verifying the change.** Without verification, the PR cannot be merged.

### Contribution Flow

```
1. Fork → 2. Branch → 3. Edit → 4. Test → 5. PR → 6. Review
```

1. **Fork** the [agents-standard](https://github.com/nbiish/agents-standard) repo
2. **Branch** from `main` with a descriptive name (`add-agent-kiro`, `update-claude-mcp`, `fix-brave-search-env`)
3. **Edit** — make your change
4. **Test** — run `node cli/test/rules.test.js && node cli/test/mcp.test.js`
5. **PR** — submit a pull request with a clear description
6. **Review** — the community and maintainers will review

---

## Agent Registry (agents.json)

`agents.json` is the structured registry of every coding agent. Each entry tracks the agent's config file, global path, project path, MCP config locations, and documentation URLs.

### Entry Schema

```json
{
  "key": "agent-key",
  "name": "Agent Name",
  "configFile": "CONFIG.md",
  "global": "~/.agent/CONFIG.md",
  "native": false,
  "mcpFormat": "json",
  "mcpProject": ".mcp.json",
  "mcpGlobal": "~/.agent/mcp.json",
  "docs": "https://docs.agent.com/config",
  "verified": "2025-06-01"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `key` | Yes | Lowercase kebab-case unique identifier. Used by `.agents rules` and all internal lookups. |
| `name` | Yes | Human-readable agent name as displayed in the TUI and CLI output. |
| `configFile` | Yes | The file the agent reads for behavior rules. |
| `global` | No | Path where the agent reads global rules. Use `~` for home directory. `null` if the agent reads `~/.agents/AGENTS.md` natively. |
| `native` | No | `true` if the agent reads `~/.agents/AGENTS.md` directly (no symlink needed). Default: `false`. |
| `mcpFormat` | No | MCP config format: `"json"`, `"jsonc"`, `"yaml"`, or `"toml"`. `null` if agent doesn't support project MCP configs. |
| `mcpProject` | No | Path where the agent reads project MCP config (relative to project root). |
| `mcpGlobal` | No | Path where the agent reads global MCP config. |
| `docs` | Yes | URL to the official documentation page that confirms these paths. |
| `verified` | Yes | Date the entry was last verified (YYYY-MM-DD). |

### How to Add a New Agent

1. Open [`agents.json`](agents.json)
2. Add a new entry to the `agents` array following the schema above
3. Find the agent's official documentation page that lists its config file locations
4. Set `verified` to today's date
5. Run `node cli/test/rules.test.js` — if the agent has `global` set, the test verifies the path format
6. Submit a PR with a link to the documentation you used

### How to Update an Existing Agent

1. Find the agent's entry in [`agents.json`](agents.json) by `key`
2. Update the changed fields
3. Update `verified` to today's date
4. In your PR description, link to the documentation confirming the change
5. Explain why the change was needed (e.g., "v2.0 changed config path from X to Y")

### Example PR: Adding a New Agent

```
Title: Add Kiro coding agent

Added Kiro to agents.json with config paths verified against:
https://docs.kiro.dev/configuration#rules

- configFile: kiro.md
- global: ~/.kiro/kiro.md
- mcpFormat: json
- mcpProject: .kiro/settings/mcp.json

Verified: 2025-06-01
```

---

## MCP Catalog (mcp-settings.json)

The MCP catalog stores server definitions for the `.agents mcp` command. Servers added here become available for `mcp pull` into any project.

### Catalog Entry Schema

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@scope/server-name"],
  "env": {
    "API_KEY_ENV": "description of the key"
  },
  "description": "What this server does",
  "category": "search",
  "tags": ["web", "api"],
  "disabled": false
}
```

### Transport Types

- **stdio**: Local subprocess with `command`, `args`, and `env`.
- **http**: Remote endpoint with `url` and optional `headers`.
- **sse**: Server-Sent Events transport (legacy).

### How to Add an MCP Server

1. Find the server's package name or URL and its required environment variables
2. Add the entry to the catalog (via PR to the example catalog, or open an [MCP server request issue](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=mcp-server.md))
3. Include the server's docs/README URL for verification
4. List all required environment variables and what they're for

### API Key Safety

The CLI's `substituteEnvVars()` function automatically replaces raw API key values with `${ENV_VAR}` references when pulling into projects. When submitting a catalog entry, use placeholder values or reference to environment variables — **never commit real API keys**.

---

## LLM Providers (providers.json)

### Entry Schema

```json
{
  "name": "Provider Name",
  "models": ["Model 1", "Model 2"],
  "apiBase": "https://api.provider.com/v1",
  "authEnvVar": "PROVIDER_API_KEY",
  "freeTier": "Free tier description or null",
  "referral": "Optional referral code or link",
  "docs": "https://docs.provider.com",
  "verified": "2025-06-01"
}
```

### How to Add a Provider

1. Open [`providers.json`](providers.json)
2. Add a new entry to the `providers` array
3. Link to the provider's API documentation confirming the endpoint and auth method
4. Run the JSON through a linter to verify it's valid
5. Submit a PR

---

## CLI Development

The `.agents` CLI is **zero dependencies** — Node.js >=16 built-ins only. This keeps installs fast and avoids supply-chain risks.

### Running Tests

```bash
# Rules tests (agent registry, symlinks, path utilities)
node cli/test/rules.test.js

# MCP tests (catalog CRUD, env var substitution, formatters)
node cli/test/mcp.test.js

# Both (required before all PRs)
node cli/test/rules.test.js && node cli/test/mcp.test.js
```

### Code Structure

```
cli/
├── index.js              # Entry point, command router, argument parser
├── lib/
│   ├── constants.js      # Agent registry, MCP formats, path constants
│   ├── fs-helpers.js     # Symlink, ensureDir, expandTilde, file utilities
│   ├── catalog.js        # mcp-settings.json read/write/validate CRUD
│   ├── scaffold.js       # Generate agent-specific MCP configs from catalog
│   ├── formatters.js     # JSON, table, key-value, status output formatters
│   └── env-var.js        # API key → env var substitution, health checks
├── commands/
│   ├── rules.js          # AGENTS.md management (TUI + headless)
│   ├── mcp.js            # MCP catalog & project management
│   ├── skills.js         # Skill discovery and info
│   ├── setup.js          # Project bootstrap
│   ├── status.js         # Health check / doctor
│   └── tui.js            # Interactive dashboard (stub)
└── test/
    ├── rules.test.js     # 13 tests
    └── mcp.test.js       # 20 tests
```

### Adding a New Command

1. Create `cli/commands/new-command.js` with a `run(opts)` export
2. Add the command to the router in `cli/index.js`
3. Add help text to the `HELP` constant
4. Add tests in `cli/test/new-command.test.js`

### Adding a New MCP Format

1. Add a new entry to `MCP_FORMATS` in `cli/lib/constants.js` with:
   - `extension` — file extension (`.json`, `.yaml`, `.toml`, `.jsonc`)
   - `serversKey` — the key in the config file where servers live (`mcpServers`, `mcp_servers`, `tools`, etc.)
   - `stringify(servers)` — function that converts a `{ [name]: serverDef }` object to a file string
   - `parse(raw)` — function that converts a file string back to a `{ [name]: serverDef }` object
2. Update any affected agent entries in `agents.json` to use the new format
3. Add tests for the format in `mcp.test.js`

---

## Website

The website at [agentsstandard.com](https://agentsstandard.com) is served from the `nbiish/agentsstandard-dot-com` repo.

### Machine-Readable Files

These files live in the `agents-standard` repo and are consumed by the website and by AI agents:

| File | Purpose | Update when |
|------|---------|-------------|
| `llms.txt` | Spec summary for LLMs | Spec changes, new CLI features |
| `agents.json` | Agent registry | New agents, config path changes |
| `providers.json` | Provider registry | New providers, endpoint changes |
| `mcp-settings.example.json` | Example catalog | New MCP servers |

---

## For AI Agents: How to Contribute

If you're an AI agent reading this file, you are welcome to contribute. Here's your protocol:

### 1. Verify Before You Edit

Before changing `agents.json` or `providers.json`:
- **Fetch the agent's official documentation** to confirm config file names and paths
- **Cross-reference** with the agent's source code or README if needed
- **Include the URL** you used for verification in your PR description

### 2. Follow the Schema Exactly

The JSON schemas in this file are authoritative. Match field names, types, and required/optional exactly. A missing required field will fail review.

### 3. Test Your Changes

Run both test suites before submitting:
```bash
node cli/test/rules.test.js && node cli/test/mcp.test.js
```

### 4. PR Description Template

Use this format for AI-submitted PRs:
```
## What
[Brief description of the change]

## Verification
Verified against: [URL to official docs]

## Tests
- [ ] node cli/test/rules.test.js
- [ ] node cli/test/mcp.test.js

## Notes
[Any additional context — edge cases, future changes expected, etc.]
```

### 5. Human Review

All PRs, whether from humans or AI agents, go through the same review process. A maintainer will verify the documentation link and merge if everything checks out.

---

## Code of Conduct

- **Verify with docs** — no guessing config paths
- **Include sources** — every registry change needs a documentation link
- **Test everything** — all PRs must pass both test suites
- **Be clear** — describe what changed and why
- **Respect the schema** — don't change the JSON structure without a spec change

---

## Questions?

Open an issue on [nbiish/agentsstandard-dot-com](https://github.com/nbiish/agentsstandard-dot-com) — the issue tracker is shared across both repos.
