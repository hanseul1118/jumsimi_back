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
          menu_image :rows[0].MENU_IMAGE ,
          contents :rows[0].CONTENTS ,
          menu_type :rows[0].MENU_TYPE ,
          start_date :rows[0].START_DATE ,
          end_date :rows[0].END_DATE ,
          restaurant_name:rows[0].RESTAURANT_NAME,
          restaurant_address:rows[0].RESTAURANT_ADDRESS,
          restaurant_phone:rows[0].RESTAURANT_PHONE,
          operation_time:rows[0].OPERATION_TIME,
          restaurant_image_1:rows[0].RESTAURANT_IMAGE_1,
          restaurant_image_2:rows[0].RESTAURANT_IMAGE_2,
          restaurant_image_3:rows[0].RESTAURANT_IMAGE_3,
          restaurant_image_4:rows[0].RESTAURANT_IMAGE_4,
          restaurant_id :rows[0].RESTAURANT_ID ,
          gps_x:rows[0].gps_x,
          gps_y:rows[0].gps_y
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

  const price = req.body.price;
  const menuImage = req.body.menuImage;
  const contents = req.body.contents;
  const startDate = req.body.start_date;
  const endDate = req.body.end_date;

  const queryString = 
  `UPDATE MENU 
	    SET  PRICE = ?
		     , ORIGINAL_IMAGE = ?
		     , CONTENTS = ?
		     , START_DATE = ?
		     , START_DATE = ?
		     , MODIFIED_TIME = NOW()
   WHERE MENU_ID = ?`
  
   await pool.query(queryString
    , price
    , menuImage
    , contents
    , startDate
    , endDate
    , menuId 
    , function (err, result) {
      if (err) throw new Error (err)

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

module.exports = router;