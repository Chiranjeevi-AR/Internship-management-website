const jwt = require('jsonwebtoken');

const identifier = (req, res, next) => {
	let token;
	// Check Authorization header first (common for API clients and SPA with axios interceptors)
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.split(' ')[1];
	} 
	// Fallback to cookies if not in header (e.g., server-rendered pages or specific setups)
	else if (req.cookies && req.cookies.Authorization && req.cookies.Authorization.startsWith('Bearer ')) {
		token = req.cookies.Authorization.split(' ')[1];
	} 
	// Check for client header as a last resort (as per original code)
	else if (req.headers.client === 'not-browser' && req.headers.authorization) {
		// Assuming this custom header also uses Bearer token format
		if (req.headers.authorization.startsWith('Bearer ')) {
			token = req.headers.authorization.split(' ')[1];
		} else {
			token = req.headers.authorization; // Or handle as plain token if format differs
		}
	}

	if (!token) {
		return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
	}

	try {
		const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
		//console.log('IDENTIFIER DEBUG:', decoded); // DEBUG: log decoded JWT
		req.user = decoded; // Attach decoded user payload to request object
		next();
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({ success: false, message: `Unauthorized: ${error.message}` });
		} if (error instanceof jwt.TokenExpiredError) {
			return res.status(401).json({ success: false, message: 'Unauthorized: Token expired' });
		}
		return res.status(500).json({ success: false, message: 'Server error during token verification' });
	}
};

// Middleware to check if the user is a System Admin
const isAdmin = (req, res, next) => {
	if (req.user && req.user.type === 'admin') { // Changed 'sysadmin' to 'admin'
		next(); // User is admin, proceed to the next middleware/handler
	} else {
		// User is not an admin or user info is not available
		return res.status(403).json({
			success: false,
			message: 'Forbidden: Access restricted to System Administrators only.'
		});
	}
};

module.exports = {
	identifier,
	isAdmin
};
