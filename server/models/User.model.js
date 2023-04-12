const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			min: 3,
			max: 20,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			max: 50,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			min: 6,
		},
	},
	{ timeStamps: true }
);

UserSchema.method({
	authenticate: async function (plain_password) {
		return await bcrypt.compare(plain_password, this.password);
	},
});

module.exports = mongoose.model("User", UserSchema);
