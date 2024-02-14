const path = require('path');
const fs = require('fs');
const assert = require('assert');

const tmp = require('tmp');
const target = require.resolve('../../lib/credential');
const root = path.resolve(__dirname, '../..');

describe('lib/credential', function () {

  beforeEach(function () {
    delete require.cache[target];
  });

  describe('Credential.createWithSetup', function () {
    let dir, credential;

    before(function () {
      dir = tmp.dirSync();
      process.chdir(dir.name);
      const Credential = require('../../lib/credential');
      credential = Credential.createWithSetup();
    });

    after(function () {
      fs.rmSync(dir.name, { recursive: true, force: true });
      process.chdir(root);
      delete require.cache[target];
    });

    it('should create config/', function () {
      const stat = fs.statSync(path.resolve(dir.name, 'config'), {throwIfNoEntry: false});
      assert.ok(stat);
      assert.ok(stat?.isDirectory());
    });

    it('should create config/master.key', function () {
      const stat = fs.statSync(path.resolve(dir.name, 'config/master.key'), {throwIfNoEntry: false});
      assert.ok(stat);
      assert.ok(stat?.isFile());
    });
  })

  describe('Credential.createMasterKey', function () {
    let dir, credential;

    before(function () {
      dir = tmp.dirSync();
      process.chdir(dir.name);
      const Credential = require('../../lib/credential');
      Credential.createMasterKey();
    });

    after(function () {
      fs.rmSync(dir.name, { recursive: true, force: true });
      process.chdir(root);
      delete require.cache[target];
    });

    it('should create config/', function () {
      const stat = fs.statSync(path.resolve(dir.name, 'config'), {throwIfNoEntry: false});
      assert.ok(stat);
      assert.ok(stat?.isDirectory());
    });

    it('should create config/master.key', function () {
      const stat = fs.statSync(path.resolve(dir.name, 'config/master.key'), {throwIfNoEntry: false});
      assert.ok(stat);
      assert.ok(stat?.isFile());
    });

    describe('master.key', function () {
      it('should ${HASH(iv)}:${HASH(master_key)}', function () {
        const stat = fs.statSync(path.resolve(dir.name, 'config/master.key'), {throwIfNoEntry: false});
        if (!stat) { return assert.fail('master.key not found'); }
        const content = fs.readFileSync(path.resolve(dir.name, 'config/master.key'), 'utf-8');
        assert.match(content, /[0-9a-f]{32}:[0-9a-f]{32}/);
      });
    });
  });

  describe('credential instance', function () {
    let dir, credential;

    before(function () {
      dir = tmp.dirSync();
      process.chdir(dir.name);
      const Credential = require('../../lib/credential');
      credential = Credential.createWithSetup();
      credential.write(`test: 1234`)
    });

    after(function () {
      fs.rmSync(dir.name, { recursive: true, force: true });
      process.chdir(root);
      delete require.cache[target];
    });

    describe('configDir', function () {
      it('should return config directory', function () {
        assert.equal(credential.configDir, path.resolve(process.cwd(), 'config'))
      })
    });

    describe('filePath', function () {
      it('should return credentials.yml.enc path', function () {
        assert.equal(credential.filePath, path.resolve(process.cwd(), 'config/credentials.yml.enc'))
      })
    });

    describe('masterKey', function () {
      it('should return HASH', function () {
        assert.match(credential.masterKey, /[0-9a-f]{32}/);
      })
    });

    describe('masterKeyFile', function () {
      it('should return master.key path', function () {
        assert.equal(credential.masterKeyFile, path.resolve(process.cwd(), 'config/master.key'))
      })
    })

    describe('iv', function () {
      it('should return Buffer', function () {
        assert.match(credential.iv.toString('hex'), /[0-9a-f]{32}/);
      })
    });

    describe('read', function () {
      it('should return test:1234', function () {
        assert.equal(credential.read(), `test: 1234`);
      })
    });

    describe('body', function () {
      it('should return encrypted text', function () {
        assert.match(credential.body, /^[0-9a-f]+$/);
      })
    });

    describe('value', function () {
      it('should return parsed credentials', function () {
        assert.deepEqual(credential.value, {test: 1234});
      })
    });

    describe('decrypt', function () {
      it('should decrypt encrypted text', function () {
        assert.equal(credential.decrypt(credential.body), `test: 1234`);
      })
    })

    describe('reset', function () {
      it('should regenerate master.key. and reencrypt credentials', function () {
        let prevBody = credential.body;
        let prevMasterKey = credential.masterKey;

        credential.reset();
        assert.notEqual(credential.body, prevBody);
        assert.notEqual(credential.masterKey, prevMasterKey);
        assert.equal(credential.read(), `test: 1234`)
      })
    });

    describe('write', function () {
      after(function () {
        credential.write(`test: 1234`);
      });

      it('should write encrypted text', function () {
        let prevBody = credential.body;
        credential.write(`test: 5678`);
        assert.notEqual(credential.body, prevBody);
        assert.match(credential.body, /^[0-9a-f]+$/);
        assert.equal(credential.read(), `test: 5678`)
      })
    })
  });
})
