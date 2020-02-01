const tokenHandler = require("../../../middleware/tokenHandler");
const errorHandler = require("../../../middleware/errorHandler");
const errCode = require("../../../middleware/errorCode");
const pool = require('../../../databaseConnect.js')
const asyncHandler = require('express-async-handler')
const express = require('express')
const router = express.Router()

router.get('/api/menudetail', asyncHandler(async (req, res, next) => {
  console.log('req.query : ', req.query)
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
          M.PRICE					        AS PRICE
        , M.ORIGINAL_IMAGE		    AS MENU_IMAGE 
        , M.CONTENTS				      AS CONTENTS 
        , M.MENU_TYPE				      AS MENU_TYPE 
        , M.START_DATE			      AS START_DATE 
        , M.END_DATA				      AS END_DATA 
        , R.RESTAURANT_NAME		    AS RESTAURANT_NAME
        , R.RESTAURANT_ADDRESS 	  AS RESTAURANT_ADDRESS
        , R.RESTAURANT_PHONE	 	  AS RESTAURANT_PHONE
        , R.LUNCH_OPERATION_TIME 	AS OPERATION_TIME
        , R.ORIGINAL_IMAGE_1		  AS RESTAURANT_IMAGE_1
        , R.ORIGINAL_IMAGE_2		  AS RESTAURANT_IMAGE_2
        , R.ORIGINAL_IMAGE_3		  AS RESTAURANT_IMAGE_3
        , R.ORIGINAL_IMAGE_4		  AS RESTAURANT_IMAGE_4
        , R.RESTAURANT_ID			    AS RESTAURANT_ID 
        , R.GPS_X                 AS GPS_X
        , R.GPS_Y                 AS GPS_Y
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
          end_data :rows[0].END_DATA ,
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
      console.log(rows)
  })
	
}))

module.exports = router;