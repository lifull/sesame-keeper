# sesame-keeper

rails-like credential management mechanism.

open sesame!

## install

```sh
npm install @lifull-dev/sesame-keeper --save
```

## setup

```sh
npx sesame setup
```

The following file is generated when this command is executed.

| file | description |
|---|---|
| config/credential.yml.enc | Encrypted configuration file. To edit, run `npx sesame edit`. |
| config/master.key | The common key used to decrypt encrypted configuration files. |
| .gitignore | A configuration file that defines exclusion patterns for git management. If it already exists, only the `master.key` will be appended. |
| .gitattributes | The specification is made to obtain the differences in the configuration file in decrypted form. If the file already exists, only an append is made. |

Be careful not to publish the generated config/master.key in git.

The key used for encryption/decryption is the `config/master.key` generated here, or if not available, the `$MASTER_KEY` environment variable.

## edit

```sh
npx sesame edit
```

This command refers to $VISUAL, $EDITOR as the editing editor.

If you want to use a different editor, set the environment variable as follows.

```sh
EDITOR=vim npx sesame edit
```

## only show

```sh
npx sesame cat
```

The contents of the decrypted configuration file are displayed when this command is executed.

## reset master.key

```sh
npx sesame reset
```

Regenerate master.key. The configuration is re-encrypted with the new key.

## help

```sh
npx sesame help
```

## load

If you want to access the configuration from within the application, write:

```javascript
const {Credential} = require('sesame-keeper');
const credential = new Credential

console.log(credential.value);
```

## example (in express)

When using express, it is useful to have the contents of the configuration file in the application object.

```javascript
const express = require('express')
const app = express()

const { Credential } = new require('sesame-keeper')
const credentials = new Credential

app.credentials = credentials.value

app.get('/', function (req, res) {
  res.send(`credential [foo]: ${req.app.credentials.foo}`)
})

app.listen(4000)
```
