const tokenHandler = require("../../../middleware/tokenHandler");
const errorHandler = require("../../../middleware/errorHandler");
const errCode = require("../../../middleware/errorCode");
const pool = require('../../../databaseConnect.js')
const asyncHandler = require('express-async-handler')
const express = require('express')
const router = express.Router()

router.post('/api/restaurant', tokenHandler.verifyToken, asyncHandler(async (req, res, next) => {
  
  // Connections are Automatically Released.
  const token = req.query.token;
  const content = tokenHandler.verifyData(token);

  /* request 변수 세팅 */
  const userId = content.userId;
  const restaurantName = req.body.restaurantName;
  const restaurantAddress = req.body.restaurantAddress;
  const restaurantPhone = req.body.restaurantPhone;
  const gpsX = req.body.gpsX;
  const gpsY = req.body.gpsY;
  const lunchOperationTime = req.body.lunchOperationTime;
  const originalImage1 = req.body.originalImage1;
  const originalImage2 = req.body.originalImage2;
  const originalImage3 = req.body.originalImage3;
  const originalImage4 = req.body.originalImage4;

  /* input 검증 */
  if (!userId
    || !restaurantName 
    || !restaurantAddress 
    || !restaurantPhone
    || !gpsX
    || !gpsY
    || !lunchOperationTime
    || !originalImage1
  ){
    res.status(errCode.OK);
    res.json({
      errCode: errCode.BADREQUEST,
      msg: `입력값이 잘못되었습니다.
          restaurantName=${restaurantName}
          , restaurantAddress=${restaurantAddress}
          , restaurantPhone=${restaurantPhone}
          , gpsX=${gpsX}
          , gpsY=${gpsY}
          , lunchOperationTime=${lunchOperationTime}
          , originalImage1=${originalImage1}
          , userId=${userId}`
    });
    return;
  }
  
  const queryString =
    "INSERT INTO RESTAURANT " + 
    "VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()) ";

  await pool.query(queryString
    , [userId , restaurantName, restaurantAddress, restaurantPhone, gpsX, gpsY
    ,  lunchOperationTime, originalImage1, originalImage2, originalImage3, originalImage4]
    , function (err, result, feilds) {
      if (err) throw new Error (err)
      console.log(result)
  })
	
}))

module.exports = router;