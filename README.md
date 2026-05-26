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
| Gemini CLI | `GEMINI.md` |
| ...and 10+ more | all different |

None of them cascade. None have a global user config. None support folder-scoped rules.

## The Standard

One file: `AGENTS.md`. Three scopes:

```
~/.agents/AGENTS.md              ← Global (user rules, all projects)
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

1. Load `~/.agents/AGENTS.md` (global — always loaded)
2. Walk from `cwd` upward to repo root, collect `.agents/AGENTS.md` files (deepest first)
3. If the target file is in a subdirectory with its own `.agents/AGENTS.md`, load that too
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

# Codex
ln -sf ~/.agents/AGENTS.md ~/.codex/instructions.md

# Cursor
ln -sf ~/.agents/AGENTS.md ~/.cursor/rules/agents-standard

# Gemini CLI
ln -sf ~/.agents/AGENTS.md ~/.gemini/GEMINI.md

# Cline
ln -sf ~/.agents/AGENTS.md ~/.cline/cline_rules
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
```

## Agent Config Map

Every agent's config file and its location:

| Agent | Config File | Global Path | Project Path |
|-------|------------|-------------|--------------|
| **Pi** | `AGENTS.md` | `~/.agents/AGENTS.md` (native) | `.agents/AGENTS.md` |
| **Claude Code** | `CLAUDE.md` | `~/.claude/CLAUDE.md` | `CLAUDE.md` |
| **OpenAI Codex** | `instructions.md` | `~/.codex/instructions.md` | `AGENTS.md` |
| **Cursor** | `.cursorrules` | `~/.cursor/rules/` | `.cursorrules` |
| **GitHub Copilot** | `copilot-instructions.md` | Settings UI | `.github/copilot-instructions.md` |
| **Windsurf** | `.windsurfrules` | `~/.codeium/windsurf/` | `.windsurfrules` |
| **Cline** | `.clinerules` | `~/.cline/cline_rules` | `.clinerules` |
| **Roo Code** | `.roorules` | `~/.roo/rules/` | `.roorules` |
| **Gemini CLI** | `GEMINI.md` | `~/.gemini/GEMINI.md` | `GEMINI.md` |
| **Kiro** | `kiro.md` | `~/.kiro/kiro.md` | `.kiro/kiro.md` |
| **Augment** | `.augment-guidelines` | `~/.augment/guidelines` | `.augment-guidelines` |
| **Goose** | `goosehints` | `~/.config/goose/goosehints` | `.goosehints` |
| **Junie** | `guidelines.md` | `~/.junie/guidelines.md` | `.junie/guidelines.md` |
| **Trae** | `.trae/rules/` | `~/.trae/rules/` | `.trae/rules/` |
| **Aider** | `.aider.conf.yml` | `~/.aider.conf.yml` | `.aider.conf.yml` |
| **Continue** | `config.json` | `~/.continue/config.json` | `.continue/config.json` |
| **Mistral Codestral** | `CODESTRAL.md` | — | `CODESTRAL.md` |
| **Qwen Code** | `QWEN.md` | — | `QWEN.md` |

## Relationship to Agent Skills

- **[Agent Skills](https://agentskills.io)** (SKILL.md) = what the agent can *do*
- **Agents Standard** (AGENTS.md) = how the agent should *behave*

Both use the `.agents/` directory. They complement each other.

## Adopt

For agent tool developers — four steps:

1. Search for `~/.agents/AGENTS.md` at startup — load as global user rules
2. Walk from `cwd` upward collecting `.agents/AGENTS.md` files
3. Load folder-scoped `.agents/AGENTS.md` when operating on files in that subtree
4. Merge: global as base, most specific scope wins conflicts

No dependencies. No schema. No build step. Just markdown files in directories.

## License

MIT — see [LICENSE](LICENSE).
