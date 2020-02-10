const errCode = require("../../../middleware/errorCode");
const pool = require("../../../databaseConnect.js");
const asyncHandler = require("express-async-handler");
const express = require("express");
const router = express.Router();

const {
  Aborter,
  BlobURL,
  BlockBlobURL,
  ContainerURL,
  ServiceURL,
  StorageURL,
  SharedKeyCredential,
  uploadStreamToBlockBlob
} = require("@azure/storage-blob");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const path = require("path");
const multer = require("multer");
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single("file"); // or .single('image')
const getStream = require("into-stream"); // change buffer to stream
const containerName = "res";
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };
// const aborter = Aborter.timeout(30 * 1000);
const STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const ACCOUNT_ACCESS_KEY = process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const credentials = new SharedKeyCredential(
  STORAGE_ACCOUNT_NAME,
  ACCOUNT_ACCESS_KEY
);
const pipeline = StorageURL.newPipeline(credentials);
// const pipeline = newPipeline(credentials);
const serviceURL = new ServiceURL(
  `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  pipeline
);

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

    // 원본 파일명 : file.originalname
    let extentios = path.extname(file.originalname);
    let originName = file.originalname.split(".");
    let filename = `${originName[0]}_${Date.now()}${extentios}`;

    const blobName = filename;
    const stream = getStream(req.file.buffer);
    const containerURL = ContainerURL.fromServiceURL(
      serviceURL,
      containerName
    );
    const blobURL = BlobURL.fromContainerURL(containerURL, blobName);
    const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);

    try {
      await uploadStreamToBlockBlob(
        Aborter.none,
        stream,
        blockBlobURL,
        uploadOptions.bufferSize,
        uploadOptions.maxBuffers
      );
    } catch (err) {

      if (err) {
        res.status(errCode.OK);
        res.json({
          errCode: errCode.SERVERERROR,
          msg: err.code
        });
        return;
      }
    }

    /* INSERT POSTING TABLE */
    const ORIGIN_SRC = `https://jumsimiowner.pickapick.io/${containerName}/${filename}`;

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

      await connection.execute(
        queryString02,
        [
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
        ],
        function(err, result, feilds) {
          
          if (err) {
            throw err
          }

          if (result.affectedRows == 0) {
            throw new Error('affectedRows is zero where restaurant table')
          }

          if (result.affectedRows >= 0) {
            console.log('successfully inserted into restaurant');
          }
      });
      
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

      await connection.execute(queryString03, [resId], function(err, result, feilds) {
        
        if (err) {
          throw err
        }
        
        if (result.affectedRows == 0) {
          throw new Error('affectedRows is zero where menu table')
        }

        if (result.affectedRows >= 0) {
          console.log('successfully inserted into menu');
        }
      });
      
      await connection.commit();

      res.status(errCode.OK).json({
        errCode: errCode.OK,
        msg: "글 등록 완료"
      });

      return;

    } catch (err) {

      await connection.rollback();

      deleteImages(blockBlobURL, blobName, "SQL error");

      throw err;

    } finally {

      connection.release();
      
    }

  })
);

const deleteImages = (
  blockBlobURL,
  blobName,
  where
) => {
  try {
    blockBlobURL.delete(Aborter.none);
    console.error(`Block blob "${blobName}" is deleted at ${where}`);
  } catch (err) {
    throw new Error(err)
  }
};

module.exports = router;
