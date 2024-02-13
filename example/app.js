const express = require('express')
const app = express()

const {Credential} = new require('../')
const credentials = new Credential

app.credentials = credentials.value

app.get('/', function (req, res) {
  res.send(`credential [hoge]: ${req.app.credentials.hoge}`)
})

let port = 4000;
app.listen(port, () => {
  console.log(`Example apps listening at http://localhost:${port}`)
})
