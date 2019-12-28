const commonConfig = require("../../../middleware/commonConfig.js");
const tokenFun = require("../../../middleware/tokenHandler.js");
const errorHandler = require("../../../middleware/errorHandler.js");
const logger = require("../../../logConfig.js");
const errCode = require("../../../middleware/errorCode.js");
const express = require("express");
const menuApi = express.Router();