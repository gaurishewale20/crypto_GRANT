const express = require("express");
const {
	fetchInvestigationController,
	fetchAllInvestigationsController,
} = require("../controllers/investigation.controller");
const verify = require("../helpers/verify");
const router = express.Router();

router.get("/:id", verify, fetchInvestigationController);
router.get("/", verify, fetchAllInvestigationsController);

module.exports = router;
