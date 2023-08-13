class AppError extends Error {
  // constructor method is called each time whem we create a new object our of this class
  constructor(message, statusCode) {
    // when we extend a parent class we call super in order to call the parent class constructor
    super(message); // calling error - message is the only parameter that the build-in error accepts / we set the message property to our incoming message

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
