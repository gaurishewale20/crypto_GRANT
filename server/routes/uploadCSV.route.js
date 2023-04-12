const express = require("express");

const {
	uploadCSVController,
	extractData,
	getCycles,
	eigenVectorCentrality,
} = require("../controllers/uploadCSV.controller");
const verify = require("../helpers/verify");
const upload = require("multer")();

const router = express.Router();

router.post("/", verify, upload.any(), uploadCSVController);
router.get("/", extractData);
router.get("/getCycles", getCycles);
// router.get("/pageRank", pageRank);
router.get("/eigen", eigenVectorCentrality);

module.exports = router;
