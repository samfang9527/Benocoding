
import jwt from "jsonwebtoken";

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

const jwtValidation = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    }
  } catch (err) {
    return err;
  }
}

export {
    wrapAsync,
    getFileExtension,
    jwtValidation
}
