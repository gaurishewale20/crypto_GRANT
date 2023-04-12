const express = require("express");

const {
	uploadCSVController,
	extractData,
	pageRank,
	getCycles,
	eigenVectorCentrality,
} = require("../controllers/uploadCSV.controller");
const upload = require("multer")();

const router = express.Router();

router.post("/", upload.any(), uploadCSVController);
router.get("/", extractData);
router.get("/getCycles", getCycles);
router.get("/pageRank", pageRank);
router.get("/eigen", eigenVectorCentrality);

module.exports = router;
