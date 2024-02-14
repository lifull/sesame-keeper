const path = require('path');
const fs = require('fs');
const assert = require('assert');

const tmp = require('tmp');
const target = require.resolve('../../lib/git');
const root = path.resolve(__dirname, '../..');

describe('lib/git', function () {

  beforeEach(function () {
    delete require.cache[target];
  });

  describe('git instance', function () {
    let dir, credential;

    before(function () {
      dir = tmp.dirSync();
      process.chdir(dir.name);
      const Git = require('../../lib/git');
      git = new Git();
    });

    after(function () {
      fs.rmSync(dir.name, { recursive: true, force: true });
      process.chdir(root);
      delete require.cache[target];
    });

    describe('attributesFile', function () {
      it('should return .gitattribute file path', function () {
        assert.equal(path.resolve(process.cwd(), '.gitattributes'), git.attributesFile);
      });
    })

    describe('ignoreFile', function () {
      it('should return .gitignore file path', function () {
        assert.equal(path.resolve(process.cwd(), '.gitignore'), git.ignoreFile);
      });
    });

    describe('attributes', function () {
      before(function () {
        fs.writeFileSync(path.resolve(process.cwd(), '.gitattributes'), 'config/credentials.yml.enc diff=credentials_manager', 'utf-8');
      });

      after(function () {
        fs.unlinkSync(path.resolve(process.cwd(), '.gitattributes'));
      });

      it('should return body of .gitattributes', function () {
        assert.equal(git.attributes, 'config/credentials.yml.enc diff=credentials_manager');
      });
    })

    describe('ignores', function () {
      before(function () {
        fs.writeFileSync(path.resolve(process.cwd(), '.gitignore'), 'node_modules', 'utf-8');
      });

      after(function () {
        fs.unlinkSync(path.resolve(process.cwd(), '.gitignore'));
      });

      it('should return body of .gitignore', function () {
        assert.equal(git.ignores, 'node_modules');
      });
    });
  });
});
