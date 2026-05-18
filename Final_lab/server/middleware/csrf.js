const crypto = require('crypto');

/**
 * Generates a CSRF token and stores it in the session.
 * Makes the token available to all EJS views via res.locals.csrfToken.
 */
function csrfToken(req, res, next) {
  if (!req.session._csrf) {
    req.session._csrf = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session._csrf;
  next();
}

/**
 * Validates the CSRF token on state-changing requests (POST, PUT, DELETE, PATCH).
 * Skips validation for API routes (which use JWT auth instead).
 */
function csrfProtect(req, res, next) {
  // Skip CSRF for API routes (they use Bearer token auth)
  if (req.originalUrl.startsWith('/api/')) return next();

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session._csrf) {
      // For AJAX requests, return JSON error
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({ error: 'Invalid CSRF token.' });
      }
      req.flash('error', 'Form expired. Please try again.');
      return res.redirect('back');
    }
  }
  next();
}

module.exports = { csrfToken, csrfProtect };
