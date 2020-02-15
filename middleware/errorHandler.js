const errCode = require("./errorCode");
const logger = require("../config/logConfig.js");

console.log('logger', logger)

exports.ConnectionErrorHandler = function(err, connection) {
  console.log('ConnectionErrorHandler err : ', err)
  if (err) {
    // logger.error('' + err)
    switch (err.code) {
      default:
        connection.release();
        return { errCode: errCode.SERVERERROR, msg: err.code };
    }
  } else {
    // logger.error("check the param");
    return;
  }
};

exports.QueryErrorHandler = function(err, connection) {
  // logger.error('QueryErrorHandler err : ' + JSON.stringify(err))
  if (err) {
    // logger.error('' + err)
    switch (err.code) {
      case "ER_DUP_ENTRY":
        connection.release();
        return { errCode: errCode.DUPLICATEERROR, msg: "Duplicate_Error" };
      default:
        connection.release();
        return { errCode: errCode.SERVERERROR, msg: err.code };
    }
  } else {
    // logger.error("check the param");
    return;
  }
};

exports.TokenErrorHandler = function(err) {
  console.log('TokenErrorHandler err : ', err)
  console.log('loggerlogger', logger)
  if (err) {
    // logger.error('' + err)
    switch (err) {
      default:
        return { errCode: errCode.UNAUTHORIZED, msg: err.message };
    }
  } else {
    // logger.error("check the param");
    return;
  }
};

exports.TransactionErrorHandler = function(err, connection) {
  console.log('TransactionErrorHandler err : ', err)
  if (err) {
    // logger.error('' + err)
    switch (err) {
      // commit, rollback 에러 재현이 어려워 default 만 작성
      default:
        connection.release();
        return { errCode: errCode.SERVERERROR, msg: err.code };
    }
  } else {
    // logger.error("check the param");
    return;
  }
};
