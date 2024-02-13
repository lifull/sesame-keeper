const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { spawn } = require('child_process');

const tmp = require('tmp');
const yaml = require('yaml')
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
    return this.masterKeyAndIv.split(':')[1];
  }

  get masterKeyAndIv() {
    return process.env.MASTER_KEY || fs.readFileSync(this.masterKeyFile, 'utf-8');
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

      fs.writeFileSync(fd, this.read(), 'utf-8');

      const editor = spawn(this.editor, [filePath], {
        stdio: [
          process.stdin,
          process.stdout,
          process.stderr,
        ],
      });

      editor.on('exit', code => {
        let text = fs.readFileSync(filePath, 'utf-8');
        this.write(text);
        cleanupCallback();
      });
    });
  }

  decryptFromBuffer(encryptedText) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.masterKey, this.iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  decrypt(text) {
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.masterKey, this.iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  read() {
    return this.decrypt(this.body);
  }

  write(text) {
    const cipher = crypto.createCipheriv("aes-256-cbc", this.masterKey, this.iv)
    let crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');

    console.log(`[write]: ${this.filePath}`);
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

    const masterKey = crypto.randomBytes(16).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');

    const keyFile = path.resolve(config, 'master.key');
    fs.writeFileSync(keyFile, `${iv}:${masterKey}`, 'utf-8');


    console.log(`[write]: ${keyFile}`);
    return masterKey;
  }

  static createWithSetup(configDirName = 'config') {
    this.createMasterKey(configDirName);
    return new this(configDirName);
  }
}


module.exports = Credential;
