const express = require("express");
const { uploadCSVController, extractData } = require("../controllers/uploadCSV.controller");
const upload = require("multer")();

const router = express.Router();

router.post("/", upload.any(), uploadCSVController);
router.get("/", extractData);

module.exports = router;
