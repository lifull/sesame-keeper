const log =  require('./log');

class CustomError extends Error {
  constructor(originalError, ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.originalError = originalError;
    this.name = this.constructor.name;
    this.date = new Date();
  }

  printDetail() {
    let error = this;
    do {
      if (Object.getPrototypeOf(error).hasOwnProperty('print')) {
        error.print();
        continue;
      }
      console.error(error);
    } while (error = error.originalError);
  }
}

module.exports.MasterKeyNotFoundError = class MasterKeyNotFoundError extends CustomError {
  constructor(originalError, ...params) {
    super(originalError, ...params);
  }

  print(){
    log.error(`config/masterkey (or MASTER_KEY) is not found`);
  }
}

module.exports.DecryptionError = class DecryptionError extends CustomError {
  constructor(originalError, ...params) {
    super(originalError, ...params);
  }

  print(){
    log.error('Decryption failed.')
    log.reason("Please make sure that the master.key is correct.");
  }
}
