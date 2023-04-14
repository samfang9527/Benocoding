

// reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
const wrapAsync = (fn) => {
    return function (req, res, next) {
      // Make sure to `.catch()` any errors and pass them along to the `next()`
      // middleware in the chain, in this case the error handler.
      fn(req, res, next).catch(next);
    };
};

const getFileExtension = (filename) => {
  if ( filename ) {
    return filename.slice(filename.lastIndexOf('.'));
  }
}

export {
    wrapAsync,
    getFileExtension
}
