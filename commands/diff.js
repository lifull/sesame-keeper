#! /usr/bin/env node

const fs = require('fs');

let Credential = require('../lib/credential');
let credential = new Credential();

let [file] = process.argv.slice(2);
const input = fs.readFileSync(file, 'utf-8');
console.log(credential.decrypt(input));
