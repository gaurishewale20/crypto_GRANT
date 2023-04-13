const Investigation = require("../models/Investigation");

// Validators
exports.fetchInvestigationController = async (req, res) => {
	const { id } = req.params;
	// console.log(req.query);
	const investigation = await Investigation.findOne({ _id: id });
	return res.status(200).json({
		investigation,
	});
};

exports.fetchAllInvestigationsController = async (req, res) => {
	const investigations = await Investigation.find({ user: req.user._id });

	return res.status(200).json({
		investigations,
	});
};
