
class Log {
  constructor(text, lv, prefix) {
    this.lv = lv;
    this._text = text;
    this._prefix = prefix
  }

  get text() {
    return `${this.indent}${this.prefix}${this._text}`
  }

  get indent() {
    return ' '.repeat(this.lv * 2)
  }

  get prefix() {
    return this._prefix ? `${this._prefix.padEnd(10, '>')}` : ''
  }

  print() {
    console.log(this.text)
  }
}

function green(text) {
  return `\u001b[32m${text}\u001b[0m`;
}

function bold(text) {
  return `\u001b[1m${text}\u001b[0m`;
}

function yellow(text) {
  return `\u001b[93m${text}\u001b[0m`;
}

function reasonSymbol() {
  return `\u25B6`;
}

function fill(text, size = 10) {
  return text.padEnd(10, ' ');
}

module.exports.create = function (text = "", lv) {
  let log = new Log(text, lv, bold(green(fill('create'))));
  log.print();
}

module.exports.append = function (text = "", lv) {
  let log = new Log(text, lv, bold(green(fill('append'))));
  log.print();
}

module.exports.replace = function (text = "", lv) {
  let log = new Log(text, lv, bold(green(fill('append'))));
  log.print();
}

module.exports.pass = function (text = "", lv) {
  let log = new Log(text, lv, bold(yellow(fill('pass'))));
  log.print();
}

module.exports.text = function (text = "", lv) {
  let log = new Log(text, lv);
  log.print();
}

module.exports.reason = function (text = "", lv) {
  let log = new Log(text, lv, ` ${reasonSymbol()} ${text}`);
  log.print();
}

