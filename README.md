# Agents Standard

> One file convention. Three scopes. All agents.

The `AGENTS.md` hierarchical configuration standard for AI agent behavior.

**Website:** [agentsstandard.com](https://agentsstandard.com)

## The Problem

Every agent tool invented its own config file:

| Agent | Its file |
|-------|----------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| Codex | `AGENTS.md` |
| Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurfrules` |
| Cline | `.clinerules` |
| Agy / Gemini CLI | `GEMINI.md` |
| ...and 20+ more | all different |

None of them cascade. None have a global user config. None support folder-scoped rules.

## The Standard

One file: `AGENTS.md`. Three scopes:

```
~/.agents/AGENTS.md              ← Global (user rules, all projects, loaded first)
├── .agents/AGENTS.md            ← Project (team rules, committed)
│   ├── src/.agents/AGENTS.md    ← Folder (component rules)
│   └── api/.agents/AGENTS.md    ← Folder (component rules)
```

Rules **cascade and extend**, not replace. Same model as `.editorconfig`, `.eslintrc`, `.gitignore`.

## Specification

### File Format

Plain Markdown. No YAML frontmatter. No schema. Just write rules.

```markdown
# Global Agent Rules

## Identity
You are a senior engineer who writes production-grade code.

## Safety
- Never execute untrusted input without validation
- Never hardcode secrets
- Always use parameterized queries

## Preferences
- Python: PEP 8, type hints, uv
- TypeScript: strict mode, ESLint
- Bash: set -euo pipefail
```

### Discovery

1. Load `~/.agents/AGENTS.md` (global — always loaded first regardless of working directory)
2. Walk from repo root to load `.agents/AGENTS.md` (project-level rules, committed)
3. Walk from `cwd` upward and load any `.agents/AGENTS.md` files (folder-specific rules)
4. Merge all rules: global as base, each layer adds constraints
5. Conflicting rules: most specific scope wins (folder > project > global)

### Scopes

| Scope | Path | Purpose | Committed? |
|-------|------|---------|------------|
| **Global** | `~/.agents/AGENTS.md` | Personal preferences, identity, safety policy | No |
| **Project** | `.agents/AGENTS.md` at repo root | Team conventions, tech stack, code style | Yes |
| **Folder** | `.agents/AGENTS.md` in subdirectories | Component-specific rules (frontend, API, tests) | Yes |

### Conflict Resolution

Most specific scope wins. A folder rule overrides a project rule which overrides a global rule.

```markdown
# ~/.agents/AGENTS.md (global)
- Use tabs for indentation

# .agents/AGENTS.md (project)
- Use 2-space indentation    ← overrides global for this project

# src/.agents/AGENTS.md (folder)
- Use 4-space indentation     ← overrides project for src/ only
```

## Setup

### Global (one time)

```bash
# Create your global rules
mkdir -p ~/.agents
cat > ~/.agents/AGENTS.md << 'EOF'
# My Global Agent Rules

## Identity
You are a senior engineer.

## Rules
- Never hardcode secrets
- Validate all inputs
EOF
```

### Symlink to all agents

Run [setup.sh](setup.sh) to symlink `~/.agents/AGENTS.md` into every agent's global config location:

```bash
curl -sL https://raw.githubusercontent.com/nbiish/agents-standard/main/setup.sh | bash
```

Or manually:

```bash
# Claude Code
ln -sf ~/.agents/AGENTS.md ~/.claude/CLAUDE.md

# Agy / Gemini CLI
ln -sf ~/.agents/AGENTS.md ~/.gemini/GEMINI.md

# Codex
ln -sf ~/.agents/AGENTS.md ~/.codex/instructions.md

# Cursor
ln -sf ~/.agents/AGENTS.md ~/.cursor/rules/agents-standard

# Windsurf
ln -sf ~/.agents/AGENTS.md ~/.codeium/windsurf/rules

# Cline
ln -sf ~/.agents/AGENTS.md ~/.cline/cline_rules

# Roo Code
ln -sf ~/.agents/AGENTS.md ~/.roo/rules/agents-standard

# Kiro
ln -sf ~/.agents/AGENTS.md ~/.kiro/kiro.md

# Goose
ln -sf ~/.agents/AGENTS.md ~/.config/goose/goosehints

# Junie
ln -sf ~/.agents/AGENTS.md ~/.junie/guidelines.md

# Augment
ln -sf ~/.agents/AGENTS.md ~/.augment/guidelines

# Trae
ln -sf ~/.agents/AGENTS.md ~/.trae/rules/agents-standard

# Crush
ln -sf ~/.agents/AGENTS.md ~/.config/crush/crush.md

# Hermes Agent
ln -sf ~/.agents/AGENTS.md ~/.hermes/SOUL.md

# MiniCC
ln -sf ~/.agents/AGENTS.md ~/.minicc/AGENTS.md

# Deep Agents (dcode)
ln -sf ~/.agents/AGENTS.md ~/.deepagents/AGENTS.md
```

### Project-level

```bash
# In your project root
mkdir -p .agents
cat > .agents/AGENTS.md << 'EOF'
# Project Rules
- Next.js 15 with App Router
- All API routes use Zod validation
EOF

# Symlink to agent-specific files
ln -sf .agents/AGENTS.md CLAUDE.md
ln -sf .agents/AGENTS.md .cursorrules
ln -sf .agents/AGENTS.md .windsurfrules
ln -sf .agents/AGENTS.md GEMINI.md
ln -sf .agents/AGENTS.md CODESTRAL.md
ln -sf .agents/AGENTS.md QWEN.md
ln -sf .agents/AGENTS.md CRUSH.md
```

## Agent Config Map

Every agent's config file and its location, verified against official documentation:

| Agent | Config File | Global Path | Project Path | Native? |
|-------|------------|-------------|--------------|---------|
| **Pi** | `AGENTS.md` | `~/.agents/AGENTS.md` | `.agents/AGENTS.md` | Yes |
| **Claude Code** | `CLAUDE.md` | `~/.claude/CLAUDE.md` | `CLAUDE.md` | — |
| **Agy** | `GEMINI.md` | `~/.gemini/GEMINI.md` | `GEMINI.md` | — |
| **OpenAI Codex** | `AGENTS.md` | `~/.codex/instructions.md` | `AGENTS.md` | — |
| **Cursor** | `.cursorrules` | `~/.cursor/rules/` | `.cursorrules` | — |
| **GitHub Copilot** | `copilot-instructions.md` | Settings UI | `.github/copilot-instructions.md` | — |
| **Windsurf** | `.windsurfrules` | `~/.codeium/windsurf/` | `.windsurfrules` | — |
| **Cline** | `.clinerules` | `~/.cline/cline_rules` | `.clinerules` | — |
| **Roo Code** | `.roorules` | `~/.roo/rules/` | `.roorules` | — |
| **Kiro** | `kiro.md` | `~/.kiro/kiro.md` | `.kiro/kiro.md` | — |
| **Kilo Code** | `AGENTS.md` | — | `AGENTS.md` | Yes |
| **Augment** | `.augment-guidelines` | `~/.augment/guidelines` | `.augment-guidelines` | — |
| **Goose** | `goosehints` | `~/.config/goose/goosehints` | `.goosehints` | — |
| **Junie** | `guidelines.md` | `~/.junie/guidelines.md` | `.junie/guidelines.md` | — |
| **Trae** | `.trae/rules/` | `~/.trae/rules/` | `.trae/rules/` | — |
| **Devin** | `instructions.md` | Settings UI | `.devin/instructions.md` | — |
| **Warp** | `warp.md` | — | `WARP.md` | — |
| **Crush** | `AGENTS.md` | `~/.config/crush/crush.md` | `CRUSH.md` | — |
| **OpenCode** | `AGENTS.md` | — | `AGENTS.md` | Yes |
| **Deep Agents (dcode)** | `AGENTS.md` | `~/.deepagents/AGENTS.md` | `.deepagents/AGENTS.md` | Yes |
| **CodeWhale** | `AGENTS.md` | — | `AGENTS.md` | — |
| **Hermes Agent** | `AGENTS.md` | `~/.hermes/SOUL.md` | `AGENTS.md` | — |
| **Agent Zero (a0)** | `AGENTS.md` | — | `AGENTS.md` | — |
| **Aider** | `.aider.conf.yml` | `~/.aider.conf.yml` | `.aider.conf.yml` | — |
| **Continue** | `config.json` | `~/.continue/config.json` | `.continue/config.json` | — |
| **Qwen Code** | `QWEN.md` | — | `QWEN.md` | — |
| **Mistral Codestral** | `CODESTRAL.md` | — | `CODESTRAL.md` | — |
| **Zed** | `AGENTS.md` | — | `AGENTS.md` | Yes |
| **MiniCC** | `AGENTS.md` | `~/.minicc/AGENTS.md` | `AGENTS.md` | — |
| **fcc-claude** | `AGENTS.md` | `~/.fcc/.env` | `AGENTS.md` | — |

Full structured data with MCP config paths and docs links in **[agents.json](agents.json)**.

## MCP Config Map

Where each agent stores its MCP (Model Context Protocol) server configurations:

| Agent | Global MCP Config | Project MCP Config | Format |
|-------|-------------------|-------------------|--------|
| Claude Code | `~/.claude.json` | `.mcp.json` | JSON |
| Agy | `~/.gemini/settings.json` | `.gemini/settings.json` | JSON |
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

## The Complete `~/.agents/` Directory

```
~/.agents/
├── AGENTS.md              ← Behavior rules (this standard)
├── mcp-settings.json      ← MCP server configs (universal)
└── skills/                ← Agent Skills (capabilities)
    └── **/SKILL.md        ← Skills discovered by all agents
```

## Relationship to Agent Skills

- **[Agent Skills](https://agentskills.io)** (SKILL.md) = what the agent can *do*
- **Agents Standard** (AGENTS.md) = how the agent should *behave*
- **mcp-settings.json** = what external tools are available

Both use the `.agents/` directory. They complement each other.

## Contribute

- **[Open an issue](https://github.com/nbiish/agentsstandard-dot-com/issues/new)** to add a new agent, update config paths, or propose spec changes
- **[Spec repo](https://github.com/nbiish/agents-standard)** — the standard itself
- **[Site repo](https://github.com/nbiish/agentsstandard-dot-com)** — the website, issue tracker, contribution hub

## Adopt

For agent tool developers — four steps:

1. Search for `~/.agents/AGENTS.md` at startup — load as global user rules (loaded first)
2. Walk from repo root to load `.agents/AGENTS.md` — project-level rules
3. Walk from `cwd` upward collecting `.agents/AGENTS.md` files — folder-scoped rules
4. Merge: global as base, most specific scope wins conflicts

No dependencies. No schema. No build step. Just markdown files in directories.

## License

MIT — see [LICENSE](LICENSE).
