const tokenHandler = require("../../../middleware/tokenHandler");
const errorHandler = require("../../../middleware/errorHandler");
const errCode = require("../../../middleware/errorCode");
const express = require("express");
const ownerRestaurantApi = express.Router();

/**
 * @method post
 * @params file, contents of post      
 * @return postId
 * 
 *    Date      Author      Contents
 * =====================================================
 *  2020.01.18  문한슬      식당 등록
 */
ownerRestaurantApi.post("/api/restaurant", tokenHandler.verifyToken, (req, res) => {

    const token = req.query.token;
    const content = tokenHandler.verifyData(token);
  
    if (content.errCode != errCode.OK) {
      res.status(errCode.OK);
      res.json(content);
      return;
    }
  
    // db connection 모듈 만들어지면 수정해야 하는 코드 
    const connection = carrotCommon.getConnectionPool();
    connection.getConnection((err, connection) => {

        /* db connection Err */
        if (err) {
            res.status(errCode.OK);
            res.json(errorHandler.ConnectionErrorHandler(err, connection));
            return;
        }

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
        ) {
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

        connection.query(
            queryString,
             [userId            , restaurantName, restaurantAddress, restaurantPhone, gpsX, gpsY
            , lunchOperationTime, originalImage1, originalImage2   , originalImage3 , originalImage4],
            (err, result, fields) => {

              /* query 및 sql Err */
              if (err) {
                res.status(errCode.OK);
                res.json(errorHandler.QueryErrorHandler(err, connection));
                return;
              }
      
              /* 성공 시 */
              if (result.affectedRows > 0) {
                res.status(errCode.OK);
                res.json({
                  errorCode: errCode.OK,
                  msg: "생성 완료"
                });
                return;
              } else {
                res.status(errCode.OK);
                res.json({
                  errCode: errCode.INSERTEERROR,
                  msg: "한 건도 INSERT 되지 않았습니다. 다시 한 번 확인해 보세요."
                });
              }
            }
        );
      
        connection.release();
    });

});
