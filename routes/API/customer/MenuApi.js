const tokenHandler = require("../../../middleware/tokenHandler");
const errorHandler = require("../../../middleware/errorHandler");
const errCode = require("../../../middleware/errorCode");
const pool = require('../../../databaseConnect.js')
const asyncHandler = require('express-async-handler')
const express = require('express')
const router = express.Router()

router.get('/api/menudetail', asyncHandler(async (req, res, next) => {

  const menuId = req.query.menuId;

  if (!menuId) {
    res.status(errCode.OK);
    res.json({
      errCode: errCode.BADREQUEST,
      msg: `입력값을 확인해주세요.
            menuId=${menuId}`
    });
    return;
  }

  const queryString = 
  `SELECT 
          M.PRICE					                            AS PRICE
        , M.ORIGINAL_IMAGE		                        AS MENU_IMAGE 
        , M.CONTENTS				                          AS CONTENTS 
        , M.MENU_TYPE				                          AS MENU_TYPE 
        , DATE_FORMAT(M.START_DATE, '%Y-%m-%d')			  AS START_DATE 
        , DATE_FORMAT(M.END_DATE  , '%Y-%m-%d')				AS END_DATE 
        , R.RESTAURANT_NAME		                        AS RESTAURANT_NAME
        , R.RESTAURANT_ADDRESS 	                      AS RESTAURANT_ADDRESS
        , R.RESTAURANT_PHONE	 	                      AS RESTAURANT_PHONE
        , R.LUNCH_OPERATION_TIME 	                    AS OPERATION_TIME
        , R.ORIGINAL_IMAGE_1		                      AS RESTAURANT_IMAGE_1
        , R.ORIGINAL_IMAGE_2		                      AS RESTAURANT_IMAGE_2
        , R.ORIGINAL_IMAGE_3		                      AS RESTAURANT_IMAGE_3
        , R.ORIGINAL_IMAGE_4		                      AS RESTAURANT_IMAGE_4
        , R.RESTAURANT_ID			                        AS RESTAURANT_ID 
        , R.GPS_X                                     AS GPS_X
        , R.GPS_Y                                     AS GPS_Y
     FROM MENU            M
    INNER JOIN RESTAURANT R
       ON M.RESTAURANT_ID = R.RESTAURANT_ID 
    WHERE M.MENU_ID = ?`
  
  await pool.query(queryString
    , menuId
    , function (err, rows, feilds) {
      if (err) throw new Error (err)
      
      if (rows.length > 0) {
        res.status(errCode.OK);
        res.json({
          errCode: errCode.OK,
          price:rows[0].PRICE,
          menuImage :rows[0].MENU_IMAGE ,
          contents :rows[0].CONTENTS ,
          menuType :rows[0].MENU_TYPE ,
          startDate :rows[0].START_DATE ,
          endDate :rows[0].END_DATE ,
          restaurantName:rows[0].RESTAURANT_NAME,
          restaurantAddress:rows[0].RESTAURANT_ADDRESS,
          restaurantPhone:rows[0].RESTAURANT_PHONE,
          operationTime:rows[0].OPERATION_TIME,
          restaurantImage1:rows[0].RESTAURANT_IMAGE_1,
          restaurantImage2:rows[0].RESTAURANT_IMAGE_2,
          restaurantImage3:rows[0].RESTAURANT_IMAGE_3,
          restaurant_Image4:rows[0].RESTAURANT_IMAGE_4,
          restaurantId :rows[0].RESTAURANT_ID ,
          gpsX:rows[0].GPS_X,
          gpsY:rows[0].GPS_Y
        });
      } else {
        res.status(errCode.OK);
        res.json({
          errCode: errCode.BADREQUEST,
          msg: "메뉴정보가 존재하지 않습니다."
        });
      }
  })
	
}))

router.put('/api/menu', asyncHandler(async (req, res, next) => {
  
  const menuId = req.body.params.menuId;

  if (!menuId) {
    res.status(errCode.OK);
    res.json({
      errCode: errCode.BADREQUEST,
      msg: `입력값을 확인해주세요.
            menuId=${menuId}`
    });
    return;
  }

  const price = req.body.params.price;
  const menuImage = req.body.params.menuImage;
  const contents = req.body.params.contents;
  const startDate = req.body.params.startDate;
  const endDate = req.body.params.endDate;

  const queryString = 
  `UPDATE MENU 
	    SET  PRICE = ?
		     , ORIGINAL_IMAGE = ?
		     , CONTENTS = ?
		     , START_DATE = ?
		     , END_DATE = ?
		     , MODIFIED_TIME = NOW()
   WHERE MENU_ID = ?`
  
   await pool.query(queryString
    , [ price
    , menuImage
    , contents
    , startDate
    , endDate
    , menuId ]
    , function (err, result) {
      console.log("err : ", err)
      if (err) throw new Error (err)
      console.log("result", result)
      if (result && result.affectedRows > 0) {
        res.status(errCode.OK);
        res.json({
          errCode: errCode.OK,
          msg: result.message
        });
      } else {
        res.status(errCode.OK);
        res.json({
          errCode: errCode.NOTFOUND,
          msg: "메뉴수정을 실패하였습니다."
        });
      }
    });
}))

/*
메뉴 리스트 조회
*/
router.get('/api/menu', asyncHandler(async (req, res, next) => {
  console.log('req.query', req.query)
    const pageCnt    = Number(req.query.pageCnt);
    const pageNumber = req.query.pageNumber;
  
    if (!pageCnt || !pageNumber) {
      res.status(errCode.OK);
      res.json({
        errCode: errCode.BADREQUEST,
        msg: `입력값을 확인해주세요.
              pageCnt=${pageCnt} 
              pageNumber=${pageNumber}`
      });
      return;
    }
    
    let firstPostNum = (pageNumber - 1) * pageCnt  // 조회할 첫번쨰 게시물 번호 세팅
  
    const queryString = 
           `SELECT M.MENU_ID                    AS menuId
                 , R.RESTAURANT_NAME				    AS restaurantName             
                 , M.CONTENTS                   AS contents                 
                 , M.MENU_TYPE                  AS menuType              
                 , M.PRICE                      AS price                 
                 , R.LUNCH_OPERATION_TIME       AS lunchOperationTime  
                 , R.ORIGINAL_IMAGE_1           AS originalImage1      
                 , R.GPS_X                      AS gpsX                  
                 , R.GPS_Y                      AS gpxY                  
              FROM RESTAURANT R                                            
        LEFT OUTER JOIN MENU M                                            
                  ON R.RESTAURANT_ID = M.RESTAURANT_ID                    
            ORDER BY M.MODIFIED_TIME DESC                                             
              LIMIT  ?, ?`                                                                              
    
    await pool.query(queryString, [firstPostNum , pageCnt]
      , function (err, rows, feilds) {
        if (err) throw new Error (err)
        
        if (rows.length > 0) {
          res.status(errCode.OK);
          res.json({
            errCode: errCode.OK,
            restaurantList: rows
          });
        } else {
          res.status(errCode.OK);
          res.json({
            errCode: errCode.BADREQUEST,
            msg: "식당이 존재하지 않습니다."
          });
        }
    })
    
  }))
module.exports = router;