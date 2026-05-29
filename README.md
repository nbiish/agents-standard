# agentsstandard.com

**The AGENTS.md hierarchical configuration standard for AI agents.**

**Live:** [agentsstandard.com](https://agentsstandard.com) · **Spec:** [nbiish/agents-standard](https://github.com/nbiish/agents-standard)

## The Standard

One file: `AGENTS.md`. Four scopes. All agents.

```
~/.agents/AGENTS.md              ← Global Base (user preferences/security, loaded first)
├── .agents/AGENTS.md            ← Project Base (committed rules for tech stack, deployment)
├── AGENTS.md                    ← Project Active / PRD (commonly modified task/feature rules)
│   ├── src/AGENTS.md            ← Folder (component rules, optional)
│   └── api/AGENTS.md            ← Folder (component rules, optional)
```

Rules cascade and extend, not replace. Same model as `.editorconfig`, `.eslintrc`, `.gitignore`.

Full specification: **[nbiish/agents-standard](https://github.com/nbiish/agents-standard)**

## .agents CLI v2.0.0

Manage your entire multi-agent configuration with one tool:

```bash
npm install -g agents-standard
```

### Three bins, one tool

```bash
.agents                    # Primary (dotted prefix — matches .agents/ directory convention)
agents-standard            # Legacy alias (full backward compatibility)
agents                     # Legacy alias
```

### Commands

```
.agents {command} [flags]

Commands:
  rules                    Manage AGENTS.md rules & symlinks
  mcp                      Manage MCP server catalogs and project configs
  skills                   Manage agent skills
  setup                    Bootstrap .agents/ in current project
  status                   System-wide health check
  tui                      Interactive terminal dashboard (default)

Flags (all commands):
  --json                   Output as JSON (headless/API mode for AI agents)
  --project <path>         Target a specific project directory
```

### Rules — AGENTS.md Management

```bash
# List all 30 agents and their symlink status
.agents rules list
.agents rules list --json      # Machine-readable for AI agents

# Interactive TUI — toggle symlinks with space, submit with Enter
.agents rules link

# Headless link/unlink all agents
.agents rules link --all
.agents rules unlink

# Manage depth and path
.agents rules depth            # → AGENTS_DEPTH=3
.agents rules depth 5          # Set to 5
.agents rules path ~/custom/AGENTS.md
```

### MCP — Server Management (the core innovation)

```bash
# Browse the global catalog (~/.agents/mcp-settings.json)
.agents mcp catalog
.agents mcp catalog toggle brave-search   # Enable/disable globally

# Pull servers into your project (.mcp.json — safe to commit!)
.agents mcp pull brave-search
.agents mcp pull --all                    # Pull all enabled servers
# API keys are AUTOMATICALLY substituted with ${ENV_VAR} references

# See what's in your project
.agents mcp project

# Check environment variables
.agents mcp health
.agents mcp health --json

# Remove from project (keeps server in catalog)
.agents mcp push brave-search

# Search for servers
.agents mcp find search
```

**Secret safety**: When you `pull` a server from the catalog, the CLI replaces raw API keys with `${ENV_VAR}` references. Your project's `.mcp.json` is safe to commit — keys never touch disk in project directories.

**Security-first setup**: For maximum security, manage API keys with PQC encryption at rest:

1. **Encrypt keys** via ML-KEM-768 + AES-256-GCM into a local bundle (`~/.config/pqc-secrets/secrets.bundle.json`)
2. **Load at shell startup** via `secrets-load` — keys decrypt into env vars in-memory, never written to disk
3. **Use `${ENV_VAR}` refs** in your catalog — no raw keys in any config file
4. **Pull into projects** with `.agents mcp pull` — env var refs propagate safely

```bash
# Catalog entry uses env var refs (no raw keys)
"brave-search": {
  "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
}

# PQC bundle decrypts key at shell startup → export BRAVE_API_KEY
# .mcp.json copies the reference → agent reads from env at runtime
```

See [`mcp-settings.example.json`](mcp-settings.example.json) for the complete security-first catalog template with PQC integration guide.

### Project Bootstrap

```bash
.agents setup                    # Interactive wizard
.agents setup --quick            # Non-interactive: create everything
.agents setup --mcp              # Only set up .mcp.json
.agents setup --rules            # Only set up AGENTS.md
.agents setup --skills           # Only set up skills directory
```

Creates:
- `.agents/AGENTS.md` — Project base rules (commit these)
- `AGENTS.md` — Project active rules (commonly modified)
- `.mcp.json` — Project MCP servers (safe to commit, no raw keys)
- `.agents/skills/` — Project-specific skills

### Health Check

```bash
.agents status                   # Full system health report
.agents status --json            # Machine-readable
.agents doctor --fix             # Auto-fix common issues
```

### Headless JSON Mode — AI Agent to AI Agent

Every command supports `--json` for programmatic consumption by other agents:

```bash
.agents rules list --json        # → [{"key":"claude-code","name":"Claude Code","status":"linked",...}]
.agents mcp catalog --json       # → {"servers":[{...}], "summary":{...}}
.agents status --json            # → {"healthy":true,"checks":[...],"issues":[]}
.agents skills list --json       # → {"global":[...],"project":[...]}
```

Exit codes: `0` = success, `1` = error, `2` = catalog validation error, `3` = permission error.

### Backward Compatibility

All v1.4.0 flags still work:

```bash
agents-standard --list           # → .agents rules list
agents-standard --link-all       # → .agents rules link --all
agents-standard --depth 3        # → .agents rules depth 3
agents-standard --version        # → .agents version
```

## Separation of Concerns: llms.txt (PRD) vs AGENTS.md (Rules)

The standard unifies project instructions by separating **what/why** from **how**:
* **`llms.txt` (Project PRD)**: Located at `{project_root}/llms.txt`. Defines the codebase context, active product requirements, tech stack, API definitions, and roadmap (the "What" and "Why").
* **`AGENTS.md` (Behavioral Cascade)**: Cascades across four scopes. Defines the guidelines, safety constraints, coding style preferences, and CLI commands the agent must follow (the "How").

## Resolution Order

1. `~/.agents/AGENTS.md` — loaded first (global base, user-specific safety/preferences)
2. `llms.txt` at repository root — project PRD (loaded second, functional requirements/tech stack)
3. `.agents/AGENTS.md` at repository root — project base rules (loaded third, committed guidelines)
4. `AGENTS.md` at repository root — project active rules (loaded fourth, active constraints, symlinked)
5. `AGENTS.md` in current working directory — folder-specific rules (loaded last, folder overrides)

Conflicts: most specific rules win (folder > active > project base > global).

## Machine-Readable Files

This repo serves structured data for agents, crawlers, and tools to intake the standard programmatically:

| File | What it is | Who it's for |
|------|-----------|--------------|
| [`llms.txt`](llms.txt) | Plain text summary of the spec + agent config map | LLMs, agents, crawlers |
| [`agents.json`](agents.json) | Structured JSON: scopes, resolution rules, all 30+ agent config paths + MCP locations | Tools, scripts, agent frameworks |
| [`providers.json`](providers.json) | Structured JSON: 15 LLM providers, API endpoints, auth patterns, referral codes | Tools, scripts, agent frameworks |
| [`providers.example.txt`](providers.example.txt) | providers.txt format template — TSV provider config reference for all agents | Users, tool makers, agents |
| [`mcp-settings.example.json`](mcp-settings.example.json) | Example universal MCP config for ~/.agents/mcp-settings.json | Users, agents |
| [`index.html`](index.html) | The full website | Humans |
| [`setup.sh`](setup.sh) | Symlink `~/.agents/AGENTS.md` to all agent configs | Users setting up |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute — for humans AND AI agents | Everyone |

### Quick intake

```bash
# For agents/crawlers — read the spec in ~2KB
curl -sL https://agentsstandard.com/llms.txt

# For tools/scripts — structured JSON
curl -sL https://agentsstandard.com/agents.json

# For users — run the setup
curl -sL https://agentsstandard.com/setup.sh | bash

# For users — install the CLI
npm install -g agents-standard
```

## The Full ~/.agents/ Directory

```
# Global ~/.agents/ (behavior + tooling)
~/.agents/
├── AGENTS.md              ← Behavior rules (global base, loaded first)
├── mcp-settings.json      ← MCP server CATALOG (stores definitions with keys — PRIVATE)
├── providers.txt          ← LLM provider config reference (agent-agnostic base)
└── skills/                ← Agent Skills (reusable capabilities)
    └── **/SKILL.md        ← Skills discovered by all agents
```

```
# Project .agents/ (tooling + project base rules)
{project}/.agents/
├── AGENTS.md              ← Project base rules (committed rules for tech stack, deployment)
├── skills/                ← Project-specific agent skills
│   └── **/SKILL.md
└── .mcp.json              ← at project root (not in .agents/ — matches Claude Code convention)
```

**Naming conventions**:
- `mcp-settings.json` = Global CATALOG with API keys (private, do not commit)
- `.mcp.json` = Project LIVE config with `${ENV_VAR}` refs (safe to commit)

- **AGENTS.md** = how the agent should *behave* (this standard)
- **mcp-settings.json** = what tools the agent can *use* (MCP catalog)
- **skills/**/SKILL.md** = what the agent can *do* ([Agent Skills](https://agentskills.io))

## Agent Config Map

Every major agent's config file, global path, and project path — verified against official docs:

| Agent | Config File | Global Path | Project Path | Native? |
|-------|------------|-------------|--------------|---------|
| Pi | `AGENTS.md` | `~/.agents/AGENTS.md` | `AGENTS.md` | Yes |
| Claude Code | `CLAUDE.md` | `~/.claude/CLAUDE.md` | `CLAUDE.md` | — |
| Agy / Gemini CLI | `GEMINI.md` | `~/.gemini/GEMINI.md` | `GEMINI.md` | — |
| OpenAI Codex | `AGENTS.md` | `~/.codex/instructions.md` | `AGENTS.md` | — |
| Cursor | `.cursorrules` | `~/.cursor/rules/` | `.cursorrules` | — |
| GitHub Copilot | `copilot-instructions.md` | Settings UI | `.github/copilot-instructions.md` | — |
| Windsurf | `.windsurfrules` | `~/.codeium/windsurf/` | `.windsurfrules` | — |
| Cline | `.clinerules` | `~/.cline/cline_rules` | `.clinerules` | — |
| Roo Code | `.roorules` | `~/.roo/rules/` | `.roorules` | — |
| Kiro | `kiro.md` | `~/.kiro/kiro.md` | `.kiro/kiro.md` | — |
| Kilo Code | `AGENTS.md` | — | `AGENTS.md` | Yes |
| Augment | `.augment-guidelines` | `~/.augment/guidelines` | `.augment-guidelines` | — |
| Goose | `goosehints` | `~/.config/goose/goosehints` | `.goosehints` | — |
| Junie | `guidelines.md` | `~/.junie/guidelines.md` | `.junie/guidelines.md` | — |
| Trae | `.trae/rules/` | `~/.trae/rules/` | `.trae/rules/` | — |
| Devin | `instructions.md` | Settings UI | `.devin/instructions.md` | — |
| Warp | `warp.md` | — | `WARP.md` | — |
| Crush | `AGENTS.md` | `~/.config/crush/crush.md` | `CRUSH.md` | — |
| OpenCode | `AGENTS.md` | — | `AGENTS.md` | Yes |
| Deep Agents (dcode) | `AGENTS.md` | `~/.deepagents/AGENTS.md` | `.deepagents/AGENTS.md` | Yes |
| CodeWhale | `AGENTS.md` | `~/.agents/AGENTS.md` | `AGENTS.md` | Yes |
| Hermes Agent | `AGENTS.md` | `~/.hermes/SOUL.md` | `AGENTS.md` | — |
| Agent Zero (a0) | `AGENTS.md` | — | `AGENTS.md` | — |
| Aider | `.aider.conf.yml` | `~/.aider.conf.yml` | `.aider.conf.yml` | — |
| Continue | `config.json` | `~/.continue/config.json` | `.continue/config.json` | — |
| Qwen Code | `QWEN.md` | — | `QWEN.md` | — |
| Mistral Codestral | `CODESTRAL.md` | — | `CODESTRAL.md` | — |
| Zed | `AGENTS.md` | `~/.config/zed/AGENTS.md` | `AGENTS.md` | Yes |
| MiniCC | `AGENTS.md` | `~/.minicc/AGENTS.md` | `AGENTS.md` | — |
| fcc-claude | `AGENTS.md` | `~/.fcc/.env` | `AGENTS.md` | — |

Full structured data in [`agents.json`](agents.json) — includes MCP config paths and docs verification links.

## MCP Config Map

Every agent's MCP server configuration location:

| Agent | Global MCP Config | Project MCP Config | Format |
|-------|-------------------|-------------------|--------|
| Claude Code | `~/.claude.json` | `.mcp.json` | JSON |
| Agy / Gemini CLI | `~/.gemini/settings.json` | `.gemini/settings.json` | JSON |
| Codex | `~/.codex/config.toml` | — | TOML |
| Cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` | JSON |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | — | JSON |
| Copilot | Settings UI | `.github/copilot-mcp.json` | JSON |
| Cline | VS Code globalStorage | — | JSON |
| Roo Code | Extension settings | `.roo/mcp.json` | JSON |
| Kiro | `~/.kiro/settings/mcp.json` | `.kiro/settings/mcp.json` | JSON |
| Kilo Code | Extension settings | `kilo.jsonc` | JSONC |
| Goose | `~/.config/goose/config.yaml` | — | YAML |
| Junie | `~/.junie/mcp.json` | `.junie/mcp/mcp.json` | JSON |
| Trae | Trae/User/mcp.json | — | JSON |
| Crush | `~/.config/crush/crush.json` | `crush.json` | JSON |
| OpenCode | `~/.config/opencode/opencode.json` | `opencode.json` | JSONC |
| dcode | `~/.deepagents/.mcp.json` | — | JSON |
| Qwen Code | `~/.qwen/settings.json` | `.qwen/settings.json` | JSON |
| Continue | `~/.continue/config.yaml` | `.continue/mcpServers/` | YAML |
| MiniCC | `~/.minicc/mcp.json` | `.minicc/mcp.json` | JSON |
| Warp | Warp Drive UI | `.warp/mcp.json` | JSON |
| Hermes Agent | `~/.hermes/config.yaml` | — | YAML |

## LLM Providers

Every agent needs a model. Provider API endpoints, auth, free tiers, and referral links:

| Provider | Key Models | API Base URL | Auth Env Var | Free Tier |
|----------|-----------|-------------|--------------|-----------|
| Anthropic | Claude Opus 4.7, Sonnet 4.6 | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` | — |
| OpenAI | GPT-5.4, GPT-5.3, o4-mini | `https://api.openai.com/v1` | `OPENAI_API_KEY` | — |
| Google Gemini | Gemini 2.5 Pro, Flash | `https://generativelanguage.googleapis.com/v1beta` | `GEMINI_API_KEY` | Flash free |
| DeepSeek | DeepSeek-V4, V3 | `https://api.deepseek.com/v1` | `DEEPSEEK_API_KEY` | — |
| OpenRouter | 250+ models | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` | Free models |
| z.ai | GLM-5.1, GLM-4.7 | `https://api.z.ai/api/coding/paas/v4` | `ZAI_API_KEY` | — |
| Wafer AI | GLM-5.1, various | `https://api.wafer.ai/v1` | `WAFER_API_KEY` | — |
| Mistral AI | Mistral Large 3, Codestral | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` | Free (rated) |
| Groq | Llama 4, Mixtral | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` | Free 30r/m |
| xAI | Grok-4, Grok-3 | `https://api.x.ai/v1` | `XAI_API_KEY` | — |
| Together AI | Llama 4, DeepSeek | `https://api.together.xyz/v1` | `TOGETHER_API_KEY` | $1 credit |
| Fireworks AI | Llama 4, Qwen | `https://api.fireworks.ai/inference/v1` | `FIREWORKS_API_KEY` | 100r/d |
| Ollama (local) | Llama 4, Qwen 3 | `http://localhost:11434/v1` | — | Free |
| LM Studio (local) | Any GGUF | `http://localhost:1234/v1` | — | Free |

**Referral links:** [z.ai](https://z.ai/subscribe?ic=B50UECNB9T) (code `B50UECNB9T`) · [OpenCode AI](https://opencode.ai/go?ref=APBJCPVXC1) (code `APBJCPVXC1`) · Wafer AI (code `8b2ul8o0`)

Full structured data: [`providers.json`](providers.json)

## Contribute — For Everyone (Humans AND AI Agents)

This is an **open standard**. Contributions come from everyone — users, tool creators, providers, AND their AI agents.

### Quick: Open an Issue

| What you want to do | Link |
|--------------------|------|
| Add/update an agent's config paths | [Agent update](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=agent-update.md) |
| Request a new agent be added | [New agent](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=new-agent.md) |
| Propose a spec change | [Spec change](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=spec-change.md) |
| Request a new MCP server | [MCP server request](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=mcp-server.md) |
| Report a CLI bug | [Bug report](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=bug.md) |

### For AI Agents Contributing

If you're an AI agent reading this, you can contribute too:

1. **Read** [`agents.json`](agents.json) for the current agent registry format
2. **Read** [`CONTRIBUTING.md`](CONTRIBUTING.md) for the contribution protocol
3. **Check** the agent's official docs to verify config paths and MCP locations
4. **Submit** a PR with the updated `agents.json` following the existing schema
5. **Include** a link to the official docs as verification

The same process applies for adding MCP servers, updating provider endpoints, or fixing CLI bugs. All PRs must pass `node cli/test/rules.test.js && node cli/test/mcp.test.js`.

### For Providers

Your agent tool updated its config file location? Your agent now reads `~/.agents/AGENTS.md` natively? Open an **[agent update](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=agent-update.md)** issue with the new path and a link to your docs.

### For Users

Found a new agent that's not on the map? Agent changed its config format? Open a **[new agent](https://github.com/nbiish/agentsstandard-dot-com/issues/new?template=new-agent.md)** issue with the config file name, paths, and a source link.

## Relationship to Agent Skills

- **[Agent Skills](https://agentskills.io)** (SKILL.md) = what the agent can *do*
- **Agents Standard** (AGENTS.md) = how the agent should *behave*
- **mcp-settings.json** = what external tools are available

Both use the `.agents/` directory. They complement each other.

## Repos

| Repo | What it is |
|------|-----------|
| [nbiish/agents-standard](https://github.com/nbiish/agents-standard) | The specification + CLI source (README, setup.sh, agents.json, cli/) |
| [nbiish/agentsstandard-dot-com](https://github.com/nbiish/agentsstandard-dot-com) | Website + machine-readable files + issue tracker |

## License

MIT — see [LICENSE](LICENSE).
