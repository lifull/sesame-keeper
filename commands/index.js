#! /usr/bin/env node

const [operation, option] = process.argv.slice(2);

const Credential = require('../lib/credential');
const Git = require('../lib/git');
const log =  require('../lib/log');
const {
  MasterKeyNotFoundError,
  DecryptionError,
} = require('../lib/error')

switch(operation) {
  case 'setup': {
    let credential = Credential.createWithSetup();
    /* write */
    credential.write(`hoge: 1234`);

    let git = new Git;
    if (!git.isRepository) {
      log.pass(`git files`)
      log.reason(`because .git directory is not found. If you start git management later, run the 'npx sesame gitsetup' command at that time.`)
      break;
    }

    git.addAttribute('config/credentials.yml.enc', 'diff=sesame');
    git.addFilter('sesame', 'npx sesame_diff');
    git.addIgnore('config/master.key');
    break;
  }
  case 'setgit': {
    let git = new Git;
    if (!git.isRepository) {
      log.error(`.git directory is not found.`)
      break;
    }

    git.addAttribute('config/credentials.yml.enc', 'diff=sesame');
    git.addFilter('sesame', 'npx sesame_diff');
    git.addIgnore('config/master.key');
    break;
  }
  case 'cat': {
    try {
      let credential = new Credential();
      console.log(credential.read());
    } catch(err) {
      option === '--debug' ? err?.printDetail() : (err.print ? err?.print() : console.error(err));
      process.exit(1);
    }

    break;
  }
  case 'edit': {
    try {
      let credential = new Credential();
      credential.edit()
    } catch(err) {
      option === '--debug' ? err?.printDetail() : (err.print ? err?.print() : console.error(err));
      process.exit(1);
    }
    break;
  }
  case 'reset': {
    let credential = new Credential();
    try {
      credential.reset();
    } catch(err) {
      if (err instanceof MasterKeyNotFoundError || err instanceof DecryptionError) {
        log.error('The current master.key is not present or incorrect, so the contents cannot be retained. If you still wish, try the setup command.');
        (option === '--debug') && err.printDetail();
        process.exit(1)
      }

      throw err;
    }
    break;
  }
  case 'help': {
    console.log(`usage: npx sesame <command>

The following is a list of commands:

  setup   This command sets up sesame.
          The following file is generated when this command is executed.

          config/credential.yml.enc: Encrypted configuration file. To edit, run 'npx sesame edit'.
          config/master.key: The common key used to decrypt encrypted configuration files.
          .gitignore: A configuration file that defines exclusion patterns for git management. If it already exists, only the 'master.key' will be appended.
          .gitattributes: The specification is made to obtain the differences in the configuration file in decrypted form. If the file already exists, only an append is made.

  setgit  This command sets up git-filter and ignore file.
          The main case to use this is if the system was not git managed during setup.

  cat     The contents of the decrypted configuration file are displayed when this command is executed.

  edit    Edit credential file. This command refers to VISUAL, EDITOR as the editing editor.

  reset   Regenerate master.key. The configuration is re-encrypted with the new key.
`);
    break;
  }
  default: {
    console.log(`'${operation}' is not a sesame commands. See 'npx sesame help'`);
  }
}
