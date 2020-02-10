const tokenHandler = require("../../../middleware/tokenHandler");
const errCode = require("../../../middleware/errorCode");
const pool = require('../../../databaseConnect.js')
const asyncHandler = require('express-async-handler')
const express = require('express')
const router = express.Router()

router.get('/api/login', asyncHandler(async (req, res, next) => {

  const userId = req.query.userId;
  const userPassword = req.query.userPassword;

  if (!userId || !userPassword) {
    res.status(errCode.OK);
    res.json({
      errCode: errCode.BADREQUEST,
      msg: `아이디나 비밀번호를 확인해주세요.
            userId=${userId}
          , userPassword=${userPassword}`
    });
    return;
  }

  const connection = await pool.getConnection();

  try {

    const queryString =
          " SELECT COUNT(*) AS isUser           " +
          "   FROM USER                         " +
          "  WHERE USER_ID=? AND USER_PASSWORD=?";
  
    let result = await connection.query(queryString, [userId , userPassword])

    if(result[0].length < 1) {
      throw new Error('data doesn\'t exist.')
    }

    if (result[0][0].isUser > 0) {
      const token = tokenHandler.makeToken({
        userId: userId
      });
      res.status(errCode.OK);
      res.json({
        errCode: errCode.OK,
        userId: userId,
        token: token
      });
    } else {
      res.status(errCode.OK);
      res.json({
        errCode: errCode.BADREQUEST,
        msg: "아이디나 비밀번호를 확인해주세요."
      });
    }

  } catch (err) {

    throw err

  } finally {

    connection.release();

  }
	
}))

// function GenerateHMAC(key, payload) {
//   // 암호화 객체 생성, sha256 알고리즘 선택
//   var hmac = crypto.createHmac('sha256', key);
//   // 암호화할 본문 생성
//   var message = new Buffer.from(payload).toString('base64');

//   hmac.write(message);
//   hmac.end();

//   return hmac.read();
// }

// function getEncryption (password) {
// var hash = GenerateHMAC(password, 'sha256');
// var encoded_hash  = new Buffer.from(hash).toString('base64');
// return encoded_hash
// }

module.exports = router;