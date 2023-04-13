const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const bcrypt = require("bcrypt");
const User = require("../models/User.model");

// Validators
const { validationResult } = require("express-validator");

exports.registerController = (req, res) => {
	const { username, email, password } = req.body;
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const firstError = errors.array().map((error) => error.msg)[0];
		return res.status(400).json({
			error: firstError,
		});
	} else {
		User.findOne({
			$or: [{ email: email }, { username: username }],
		})
			.then(async (user) => {
				if (user) {
					return res.status(400).json({
						error: "User already exists",
					});
				}

				const salt = await bcrypt.genSalt(10);
				const hashed_password = await bcrypt.hash(password, salt);

				const newUser = new User({
					username,
					email,
					password: hashed_password,
				});
				console.log(user);
				newUser
					.save()
					.then((result) => {
						return res.status(200).json({
							success: true,
							message:
								"Register Success! Please Login now to continue.",
						});
					})
					.catch((err) => {
						return res.status(400).json({
							error: "Some error occured! Please try again" + err,
						});
					});
			})
			.catch((err) => {
				return res.status(400).json({ err });
			});
	}
};

exports.loginController = (req, res) => {
	const { email, password } = req.body;
	console.log(email, password);
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const firstError = errors.array().map((error) => error.msg)[0];
		return res.status(400).json({
			error: firstError,
		});
	} else {
		User.findOne({
			email: email,
		})
			.then(async (user) => {
				if (!user) {
					return res.status(400).json({
						error: "User does not exists. Please register",
					});
				}

				if (!(await user.authenticate(password))) {
					return res.status(400).json({
						error: "Email and password do not match",
					});
				}

				const token = jwt.sign(
					{
						_id: user._id,
					},
					process.env.JWT_SECRET,
					{
						expiresIn: "7d",
					}
				);

				const { _id, username, email, profilePicture, role } = user;

				return res.json({
					token,
					user: {
						_id,
						username,
						email,
						profilePicture,
						role,
					},
				});
			})
			.catch((err) => {
				return res.status(400).json({
					error: "User does not exists. Please register",
				});
			});
	}
};
