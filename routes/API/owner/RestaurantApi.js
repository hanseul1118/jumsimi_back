const tokenHandler = require("../../../middleware/tokenHandler");
const errorHandler = require("../../../middleware/errorHandler");
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
    try {

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

      /* input 검증 */
      if (
        !resOwnersId ||
        !restaurantName ||
        !restaurantAddress ||
        !restaurantPhone ||
        !gpsX ||
        !gpsY ||
        !lunchOperationTime
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
            , resOwnersId=${resOwnersId}`
        });
        return;
      }

      const queryString =
        `INSERT INTO RESTAURANT
                    (RESTAURANT_ID,
                     USER_ID,
                     RESTAURANT_NAME,
                     RESTAURANT_ADDRESS,
                     RESTAURANT_PHONE,
                     GPS_X,
                     GPS_Y,
                     LUNCH_OPERATION_TIME,
                     ORIGINAL_IMAGE_1,
                     CREATED_TIME,
                     MODIFIED_TIME)
        VALUES      (UUID(), 
                     ?, 
                     ?, 
                     ?, 
                     ?, 
                     ?, 
                     ?, 
                     ?, 
                     ?, 
                     CURRENT_TIMESTAMP(), 
                     CURRENT_TIMESTAMP())`;

      await pool.query(
        queryString,
        [
          resOwnersId,
          restaurantName,
          restaurantAddress,
          restaurantPhone,
          gpsX,
          gpsY,
          lunchOperationTime,
          ORIGIN_SRC
        ],
        function(err, result, feilds) {
          if (err) {
            // blob stotage 에 저장했던 origin, thumbnail photo 삭제
            deleteImages(
              blockBlobURL,
              blobName,
              "SQL error"
            );

            res.status(errCode.OK);
            res.json({
              errCode: errCode.SERVERERROR,
              msg: 'SQL error'
            });
            return;
          }
          
          /* 등록된 글이 존재하지 않는 경우 */
          if (result.affectedRows == 0) {
            // blob stotage 에 저장했던 origin, thumbnail photo 삭제
            deleteImages(
              blockBlobURL,
              blobName,
              "insert error"
            );

            res.status(errCode.OK);
            res.json({
              errCode: errCode.INSERTEERROR,
              msg: "등록할 글이 존재하지 않습니다."
            });
            return;
          }

          if (result.affectedRows >= 0) {
            res.status(errCode.OK).json({
              errCode: errCode.OK,
              msg: "글 등록 완료"
            });
          }
        });
    } catch (error) {
      next(error);
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
