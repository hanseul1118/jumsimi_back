const errCode = require("../../../middleware/errorCode");
const imageHandler = require("../../../middleware/imageHandler");
const pool = require("../../../databaseConnect.js");
const asyncHandler = require("express-async-handler");
const express = require("express");
const router = express.Router();

const multer = require("multer");
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single("file"); // or .single('image')

router.post(
  "/api/restaurant", uploadStrategy, 
  asyncHandler(async (req, res, next) => {

    let file = req.file;

    if (!file) {
      res.status(errCode.OK).json({
        errCode: errCode.BADREQUEST,
        msg: "file이 없습니다."
      });
      return;
    }

    let ORIGIN_SRC = ''
    let blockBlobURL = ''
    let blobName = ''

    try {

      let result = await imageHandler.imageUpload(file)

      ORIGIN_SRC = result.src
      blockBlobURL = result.URL
      blobName = result.name

    } catch (err) {

      if (err) {
        console.log('err : ', err);
        res.status(errCode.OK);
        res.json({
          errCode: errCode.SERVERERROR,
          msg: err
        });
        return;
      }

    }

    const resOwnersId = req.body.resOwnersId;
    const restaurantName = req.body.restaurantName;
    const restaurantAddress = req.body.restaurantAddress;
    const restaurantPhone = req.body.restaurantPhone;
    const gpsX = req.body.gpsX;
    const gpsY = req.body.gpsY;
    const lunchOperationTime = req.body.lunchOperationTime;
    const modifiedUserId = req.body.modifiedUserId;

    /* input 검증 */
    if (
      !resOwnersId ||
      !restaurantName ||
      !restaurantAddress ||
      !restaurantPhone ||
      !gpsX ||
      !gpsY ||
      !lunchOperationTime ||
      !modifiedUserId
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
          , resOwnersId=${resOwnersId}
          , modifiedUserId=${modifiedUserId}`
      });
      return;
    }

    let resId = ''

    const connection = await pool.getConnection();

    await connection.beginTransaction();

    try {

      const queryString01 =
              " SELECT UUID() as uuid";

      let result = await connection.query(queryString01);

      if (result[0].length < 1) {
        throw new Error('uuid was not created');
      }

      resId = result[0][0].uuid 
      // 'result[0][0]' looks like wired, but this library returns a tuple when the result of query is a one records.
      // So if we want just the first record of the result, we can access it with result[0][0].

      const queryString02 =
      `INSERT INTO RESTAURANT
                 ( RESTAURANT_ID
                 , USER_ID
                 , RESTAURANT_NAME
                 , RESTAURANT_ADDRESS
                 , RESTAURANT_PHONE
                 , GPS_X
                 , GPS_Y
                 , LUNCH_OPERATION_TIME
                 , ORIGINAL_IMAGE_1
                 , MODIFIED_USER_ID
                 , CREATED_TIME
                 , MODIFIED_TIME)
      VALUES     ( ? 
                 , ? 
                 , ? 
                 , ? 
                 , ? 
                 , ? 
                 , ? 
                 , ? 
                 , ? 
                 , ?
                 , CURRENT_TIMESTAMP()
                 , CURRENT_TIMESTAMP())`;
      
      let qureyParam02 = [
        resId,
        resOwnersId,
        restaurantName,
        restaurantAddress,
        restaurantPhone,
        gpsX,
        gpsY,
        lunchOperationTime,
        ORIGIN_SRC,
        modifiedUserId
      ]

      const result02 = await connection.execute(queryString02,qureyParam02)

      if(result02[0].affectedRows == 0) {
        throw new Error('affectedRows is zero where restaurant table')
      }

      if(result02[0].affectedRows == 1) {
        console.log('successfully inserted into restaurant');
      }
      
      const queryString03 =
      `INSERT INTO MENU
                 ( RESTAURANT_ID
                 , MENU_ID
                 , PRICE
                 , ORIGINAL_IMAGE
                 , CONTENTS
                 , MENU_TYPE
                 , START_DATE
                 , END_DATE
                 , CREATED_TIME
                 , MODIFIED_TIME)
      VALUES     ( ?
                 , UUID()
                 , 0
                 , 'https://jumsimiowner.pickapick.io/res/unnamed.gif'
                 , '내용을 입력해 주세요.'
                 , '01'
                 , '20200101'
                 , '20200101'
                 , CURRENT_TIMESTAMP()
                 , CURRENT_TIMESTAMP())`;
      
      const result03 = await connection.execute(queryString03, [resId])
      
      if(result03[0].affectedRows == 0) {
        throw new Error('affectedRows is zero where menu table')
      }

      if(result03[0].affectedRows == 1) {
        console.log('successfully inserted into menu');
      }
      
      await connection.commit();

      res.status(errCode.OK).json({
        errCode: errCode.OK,
        msg: "글 등록 완료"
      });

    } catch (err) {

      await connection.rollback();

      imageHandler.deleteImages(blockBlobURL, blobName, "SQL error");

      res.status(errCode.OK)
      res.json({
        errCode: errCode.SERVERERROR,
        msg: "식당 정보 등록에 실패하였습니다."
      });

      throw err;

    } finally {

      connection.release();

    }

  })
);

module.exports = router;
