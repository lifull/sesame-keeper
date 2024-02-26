const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { spawn } = require('child_process');

const tmp = require('tmp');
const yaml = require('yaml')
const log =  require('./log');
const root = process.cwd();
const {
  MasterKeyNotFoundError,
  DecryptionError,
} = require('./error')

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

      throw new MasterKeyNotFoundError(err);
    }
  }

  get masterKeyFile() {
    return path.resolve(this.configDir, 'master.key');
  }

  get body() {
    return fs.readFileSync(this.filePath, 'utf-8');
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
      throw new DecryptionError(err);
    }
  }

  decrypt(text) {
    return text.split(/\r\n|\n|\r/)
      .map(line => {
        /* ignore git conflict identifiers */
        if (/^\<\<\<\<\<\<\< HEAD$/.test(line)) {
          return line;
        }
        if (/^\=\=\=\=\=\=\=$/.test(line)) {
          return line;
        }
        if (/\>\>\>\>\>\>\> .+$/.test(line)) {
          return line;
        }

        const encryptedText = Buffer.from(line, 'hex');
        return this.decryptFromBuffer(encryptedText);
      })
      .join("\n")
  }

  encrypt(text) {
    return text.split(/\r\n|\n|\r/)
      .map(line => {
        const cipher = crypto.createCipheriv("aes-256-cbc", this.masterKey, this.iv)
        let crypted = cipher.update(line,'utf8','hex');
        crypted += cipher.final('hex');
        return crypted;
      })
      .join("\n");
  }

  read() {
    return this.decrypt(this.body);
  }

  write(text) {
    let crypted = this.encrypt(text);

    log.create(`${path.relative(root, this.filePath)}`);
    fs.writeFileSync(this.filePath, crypted, 'utf-8');
  }

  reset() {
    let body = this.read();
    this.constructor.createMasterKey(this.configDir);
    this.write(body);
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
