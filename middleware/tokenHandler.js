const jwt = require("jsonwebtoken");
const config = require("../../jumsimi_back_config/tokenKey.json");
const errorHandler = require("./errorHandler.js");
const code = require("./errorCode.js");

exports.makeToken = function(obj) {
  return jwt.sign(obj, config.key);
};
exports.makeTokenWithDate = function(obj, date) {
  return jwt.sign(obj, config.key, { expiresIn: date });
};

exports.verifyToken = function(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.query.token = bearerToken;
    next();
  } else {
    res.status(code.OK);
    res.json({ errCode: code.UNAUTHORIZED, mag: "인증실패" });
  }
};

exports.verifyData = function(token) {
  try {
    return { errCode: code.OK, content: jwt.verify(token, config.key) };
  } catch (err) {
    return errorHandler.TokenErrorHandler(err, connection);
  }
};
