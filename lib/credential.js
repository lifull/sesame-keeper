const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { spawn } = require('child_process');

const tmp = require('tmp');
const yaml = require('yaml')
const log =  require('./log');
const root = process.cwd();

class Credential {
  constructor(configDirName = 'config') {
    this.configDirName = configDirName;
    this.fileName = 'credentials.yml.enc';
  }

  get configDir() {
    return path.resolve(root, this.configDirName);
  }

  get filePath() {
    return path.resolve(this.configDir, this.fileName);
  }

  get masterKey() {
    return Buffer.from(this.masterKeyAndIv.split(':')[1].trim(), 'hex');
  }

  get masterKeyAndIv() {
    try {
      return fs.readFileSync(this.masterKeyFile, 'utf-8')
    } catch(err) {
      if (process.env.MASTER_KEY) {
        return process.env.MASTER_KEY;
      }

      log.error(`config/masterkey (or MASTER_KEY) is not found`);
      throw err;
    }
  }

  get masterKeyFile() {
    return path.resolve(this.configDir, 'master.key');
  }

  get body() {
    return fs.readFileSync(this.filePath, 'utf-8');
  }

  get hasConflict() {
    return /^\<\<\<\<\<\<\< HEAD\n[0-9a-f]+?\n\=\=\=\=\=\=\=\n[0-9a-f]+?\n\>\>\>\>\>\>\> .+\n$/.test(this.body)
  }

  get conflictParts() {
    let matches = this.body.match(/^(\<\<\<\<\<\<\< HEAD\n)([0-9a-f]+?)(\n\=\=\=\=\=\=\=\n)([0-9a-f]+?)(\n\>\>\>\>\>\>\> .+\n)$/);
    if (!matches) {
      return false;
    }

    let [start, body1, separator, body2, end] = matches.slice(1)
    return { start, body1, separator, body2, end };
  }

  get iv() {
    return Buffer.from(this.masterKeyAndIv.split(':')[0], 'hex');
  }

  get editor() {
    return process.env.VISUAL || process.env.EDITOR || 'vi';
  }

  get chompedFileName() {
    return this.fileName.replace('.enc', '');
  }

  get value() {
    return yaml.parse(this.read());
  }

  edit() {
    tmp.file({postfix: `-${this.chompedFileName}`}, (err, filePath, fd, cleanupCallback) => {
      if (err) throw err;

      let decryptedText = this.read();

      fs.writeFileSync(fd, decryptedText, 'utf-8');

      const editor = spawn(this.editor, [filePath], {
        stdio: [
          process.stdin,
          process.stdout,
          process.stderr,
        ],
      });

      editor.on('exit', code => {
        let text = fs.readFileSync(filePath, 'utf-8');

        /* If there is no difference between before and after editing,
         * do not write the message because the entire conflict message will be encrypted if it is saved even
         * when the edit is canceled if there is an alteration due to a conflict in git without going through sesame.
         */
        if (text === decryptedText) {
          log.pass('config/credentials.yml.enc');
          log.reason('There is no difference in credentials')
          cleanupCallback();

          return;
        }

        this.write(text);
        cleanupCallback();
      });
    });
  }

  decryptFromBuffer(encryptedText) {
    try {
      const decipher = crypto.createDecipheriv("aes-256-cbc", this.masterKey, this.iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch(err) {
      log.error('Decryption failed.')
      log.reason("Please make sure that the master.key is correct. \n");
      throw err;
    }
  }

  decrypt(text) {
    const encryptedText = Buffer.from(text, 'hex');
    return this.decryptFromBuffer(encryptedText);
  }

  read() {
    if (this.hasConflict) {
      let {start, body1, separator, body2, end} = this.conflictParts;
      return `${start}${this.decrypt(body1)}${separator}${this.decrypt(body2)}${end}`;
    }

    return this.decrypt(this.body);
  }

  write(text) {
    const cipher = crypto.createCipheriv("aes-256-cbc", this.masterKey, this.iv)
    let crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');

    log.create(`${path.relative(root, this.filePath)}`);
    fs.writeFileSync(this.filePath, crypted, 'utf-8');
  }

  reset() {
    try {
      let body = this.read();
      this.constructor.createMasterKey(this.configDir);
      this.write(body);
    } catch(err) {
      log.error('The current master.key is not present, so the contents cannot be retained. If you still wish, try the setup command.');
      throw err;
    }
  }

  static createMasterKey(configDirName = 'config') {
    const config = path.resolve(root, configDirName);
    fs.mkdirSync(config, { recursive: true });

    const masterKey = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');

    const keyFile = path.resolve(config, 'master.key');
    fs.writeFileSync(keyFile, `${iv}:${masterKey}`, 'utf-8');

    log.create(`${path.relative(root, keyFile)}`);
    return masterKey;
  }

  static createWithSetup(configDirName = 'config') {
    this.createMasterKey(configDirName);
    return new this(configDirName);
  }
}


module.exports = Credential;
