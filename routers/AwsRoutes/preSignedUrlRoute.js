const express = require("express");
const router = express.Router();
const protect = require('../../middlewares/authMiddleware');
const preSignedUrlController = require('../../controllers/AwsController/preSignedUrlController');


router.post("/",preSignedUrlController.generateUrl);

module.exports = router;
