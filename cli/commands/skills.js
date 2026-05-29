// skills.js — Agent skill discovery, install, and apply
// Zero dependencies. Node.js >=16 built-ins only.

const path = require('path');
const { GLOBAL_SKILLS_DIR, PROJECT_SKILLS_DIR } = require('../lib/constants');
const { exists, listDir, findSkills, collapseTilde, projectPath } = require('../lib/fs-helpers');
const { formatJSON, formatTable, formatStatus, formatSection } = require('../lib/formatters');

function cmdList(asJson, projectDir) {
  const globalSkills = findSkills(GLOBAL_SKILLS_DIR);
  const projectSkillsDir = projectPath(projectDir, PROJECT_SKILLS_DIR);
  const projectSkills = findSkills(projectSkillsDir);

  const all = {
    global: globalSkills.map(s => ({ name: s.name, location: 'global', path: collapseTilde(s.path) })),
    project: projectSkills.map(s => ({ name: s.name, location: 'project', path: collapseTilde(s.path) })),
  };

  if (asJson) {
    console.log(formatJSON(all));
  } else {
    if (globalSkills.length > 0) {
      console.log(`Global skills (${collapseTilde(GLOBAL_SKILLS_DIR)}):`);
      for (const s of globalSkills) {
        console.log(`  ${formatStatus('ok', s.name)}`);
      }
    } else {
      console.log(formatStatus('info', 'No global skills found.'));
      console.log(`  Place SKILL.md files in ${collapseTilde(GLOBAL_SKILLS_DIR)}/<name>/`);
    }

    if (projectSkills.length > 0) {
      console.log(`\nProject skills:`);
      for (const s of projectSkills) {
        console.log(`  ${formatStatus('ok', s.name)}`);
      }
    }
  }
}

function cmdInfo(name, asJson) {
  if (!name) {
    console.error('Usage: .agents skills info <name>');
    process.exit(1);
  }

  // Check global first, then project
  const globalSkillPath = path.join(GLOBAL_SKILLS_DIR, name, 'SKILL.md');
  const projectSkillPath = projectPath(null, PROJECT_SKILLS_DIR, name, 'SKILL.md');

  let skillMd = null;
  let location = null;

  if (exists(globalSkillPath)) {
    skillMd = require('../lib/fs-helpers').readFile(globalSkillPath);
    location = 'global';
  } else if (exists(projectSkillPath)) {
    skillMd = require('../lib/fs-helpers').readFile(projectSkillPath);
    location = 'project';
  }

  if (!skillMd) {
    console.error(`Skill "${name}" not found.`);
    process.exit(1);
  }

  if (asJson) {
    console.log(formatJSON({ name, location, content: skillMd }));
  } else {
    console.log(`Skill: ${name} (${location})`);
    console.log('─'.repeat(60));
    console.log(skillMd);
  }
}

function run(opts = {}) {
  const { subcommand, args = [], json: asJson = false, project } = opts;

  switch (subcommand) {
    case 'list':
      cmdList(asJson, project);
      break;
    case 'info':
      cmdInfo(args[0], asJson);
      break;
    case 'install':
    case 'remove':
    case 'update':
    case 'apply':
      console.log(formatStatus('info', `\`.agents skills ${subcommand}\` coming in v2.1.0.`));
      console.log('For now, manage skills manually in ~/.agents/skills/ or .agents/skills/.');
      break;
    default:
      cmdList(asJson, project);
  }
}

module.exports = { run };
