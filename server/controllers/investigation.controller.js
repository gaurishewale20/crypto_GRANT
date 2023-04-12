const Investigation = require("../models/Investigation");

// Validators
exports.fetchInvestigationController = async (req, res) => {
	const { invesId } = req.params;
	const investigation = await Investigation.findOne({ _id: invesId });
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
