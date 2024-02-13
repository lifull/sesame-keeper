const path = require('path');
const fs = require('fs')
const { execSync } = require('child_process');
const root = process.cwd();

class Git {
  constructor() {}

  get attributesFile() {
    return path.resolve(root, '.gitattributes');
  }

  get ignoreFile() {
    return path.resolve(root, '.gitignore');
  }

  get attributes() {
    try {
      const attributes = fs.readFileSync(this.attributesFile, 'utf-8');
      return attributes;
    } catch(err) { return ''; }
  }

  set attributes(text) {
    fs.writeFileSync(this.attributesFile, text, 'utf-8');
  }

  get ignores() {
    try {
      const ignores = fs.readFileSync(this.ignoreFile, 'utf-8');
      return ignores;
    } catch(err) { return ''; }
  }

  set ignores(text) {
    fs.writeFileSync(this.ignoreFile, text, 'utf-8');
  }

  filter(name) {
    try {
      const setting = execSync(`git config --get diff.${name}.textconv`);
      return setting;
    } catch(err) { return null; }
  }

  hasDiffFilter(name) {
    return !!this.filter(name);
  }

  addFilter(name, command) {
    if (this.hasDiffFilter(name)) {
      console.log(`[add git-filter] already setting: ${this.filter(name)}`.trim());
      return;
    }

    execSync(`git config diff.${name}.textconv '${command}'`)
    console.log(`[add git-filter] diff.${name}`);
  }

  hasAttribute(pattern, setting) {
    const regex = new RegExp(`^${escape(pattern)}\\s\+${escape(setting)}$`, 'm');
    return regex.test(this.attributes);
  }

  addAttribute(pattern, setting) {
    if (this.hasAttribute(pattern, setting)) {
      console.log(`[add git-attributes] already setting: ${pattern} ${setting}`);
      return;
    }
    this.attributes = (this.attributes.trim() + "\n" + `${pattern} ${setting}`).trim() + "\n";
  }

  hasIgnore(pattern) {
    const regex = new RegExp(`^${escape(pattern)}$`, 'm');
    return regex.test(this.ignores);
  }

  addIgnore(pattern) {
    if (this.hasIgnore(pattern)) {
      console.log(`[add git-ignore] already setting: ${pattern}`);
      return;
    }
    this.ignores = (this.ignores.trim() + "\n" + `${pattern}`).trim() + "\n";
  }
}

function escape(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = Git;
