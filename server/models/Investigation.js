const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const InvestigationSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		file: {
			type: String,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
	},
	{ timeStamps: true }
);

module.exports = mongoose.model("Investigation", InvestigationSchema);
