#! /usr/bin/env node

const [operation] = process.argv.slice(2);

let Credential = require('../lib/credential');
let Git = require('../lib/git');

switch(operation) {
  case 'setup': {
    let credential = Credential.createWithSetup();
    /* write */
    credential.write(`hoge: 1234`);

    let git = new Git;
    git.addAttribute('config/credentials.yml.enc', 'diff=sesame');
    git.addFilter('sesame', 'npx sesame_diff');
    git.addIgnore('config/master.key');
    break;
  }
  case 'cat': {
    let credential = new Credential();
    console.log(credential.read());
    break;
  }
  case 'edit': {
    let credential = new Credential();
    credential.edit()
    break;
  }
  case 'reset': {
    let credential = new Credential();
    credential.reset();
    break;
  }
}
