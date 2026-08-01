/**
 * authorizeMiddleware
 * 
 * Minimal implementation because user roles (e.g. Admin, User) are not currently supported
 * or implemented in the user schema or database of this project.
 * If roles are added in the future, this middleware can be updated to check roles attached to req.user.
 */
const authorizeMiddleware = (roles = []) => {
  return (req, res, next) => {
    // Currently, it just allows all authenticated requests to proceed.
    next();
  };
};

module.exports = authorizeMiddleware;
