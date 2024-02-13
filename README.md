# credentials-manager

rails-like credential management mechanism

## install

```sh
npm install {this package} --save
```

## setup

```sh
npx credentials setup
```

## edit

```sh
npx credentials edit
```

This command refers to $VISUAL, $EDITOR as the editing editor.

If you want to use a different editor, set the environment variable as follows.

```sh
EDITOR=vim npx credentials edit
```

## only show

```sh
npx credentials cat
```

## reset master.key

```sh
npx credentials reset
```

## load

```javascript
const {Credential} = require('credentials-manager');
const credential = new Credential

console.log(credential.value);
```

## example (in express)

```javascript
const express = require('express')
const app = express()

const {Credential} = new require('credentials-manager')
const credentials = new Credential

app.credentials = credentials.value

app.get('/', function (req, res) {
  res.send(`credential [foo]: ${req.app.credentials.foo}`)
})

app.listen(4000)
```
