const path = require('path');
const fs = require('fs')
const { execSync } = require('child_process');

const root = process.cwd();
const log =  require('./log');

class Git {
  constructor() {}

  get isRepository() {
    return fs.existsSync('.git');
  }

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
      return setting.toString().trim();
    } catch(err) { return null; }
  }

  hasDiffFilter(name) {
    return !!this.filter(name);
  }

  addFilter(name, command) {
    if (this.hasDiffFilter(name)) {
      log.pass(`.git/config`);
      log.reason(`because already setting git filter. '${this.filter(name)}'`);
      return;
    }

    execSync(`git config diff.${name}.textconv '${command}'`)
    log.append(`.git/config`)
    log.text(`* add git filter`)
  }

  hasAttribute(pattern, setting) {
    const regex = new RegExp(`^${escape(pattern)}\\s\+${escape(setting)}$`, 'm');
    return regex.test(this.attributes);
  }

  addAttribute(pattern, setting) {
    if (this.hasAttribute(pattern, setting)) {
      log.pass('.gitattributes');
      log.reason(`because already setting: ${pattern} ${setting}`);
      return;
    }

    this.attributes = (this.attributes.trim() + "\n" + `${pattern} ${setting}`).trim() + "\n";
    log.append(`.gitattributes`);
    log.text(`configured git filter in config/credential.yml.enc.`);
  }

  hasIgnore(pattern) {
    const regex = new RegExp(`^${escape(pattern)}$`, 'm');
    return regex.test(this.ignores);
  }

  addIgnore(pattern) {
    if (this.hasIgnore(pattern)) {
      log.pass(`.gitignore`)
      log.reason(`because already setting: ${pattern}`);
      return;
    }
    this.ignores = (this.ignores.trim() + "\n" + `${pattern}`).trim() + "\n";
  }
}

function escape(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = Git;
