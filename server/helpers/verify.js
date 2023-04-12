const jwt = require("jsonwebtoken");

function verify(req, res, next) {
	const authHeader = req.headers.authorization;
	console.log(req.headers);
	if (authHeader) {
		const token = authHeader.split(" ")[1];
		console.log(`Token: ${token}`);
		jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
			if (err) {
				return res.status(403).json("Token is not valid!");
			}
			req.user = user;
			next();
		});
	} else {
		return res.status(401).json("You are not authenticated!");
	}
}

module.exports = verify;
