const express = require("express");
const router = express.Router();
const s3Controller = require("../../controllers/AwsController/s3Controller");


router.post("/",s3Controller.calculatePrefixSize);

module.exports = router;