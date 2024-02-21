#! /usr/bin/env node

const fs = require('fs');

let Credential = require('../lib/credential');
let credential = new Credential();

let [file] = process.argv.slice(2);
const input = fs.readFileSync(file, 'utf-8');
try {
  console.log(credential.decrypt(input));
} catch(err) {
  console.log('(Decryption failed. master.key may have been reset. In that case, this behavior is normal.　If not, please check master.key.)')
}
