const errCode = require("../../../middleware/errorCode");
const pool = require('../../../databaseConnect.js')
const asyncHandler = require('express-async-handler')
const express = require('express')
const router = express.Router()

// 메뉴 상세 조회
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

  const connection = await pool.getConnection();

  try {
    
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
    
    let result = await pool.query(queryString, [menuId])

    if(result[0].length < 1) {
      throw new Error (err)
    }

    if (result[0][0]) {
      res.status(errCode.OK);
      res.json({
        errCode            : errCode.OK,
        price              : result[0][0].PRICE,
        menuImage          : result[0][0].MENU_IMAGE,
        contents           : result[0][0].CONTENTS,
        menuType           : result[0][0].MENU_TYPE,
        startDate          : result[0][0].START_DATE,
        endDate            : result[0][0].END_DATE,
        restaurantName     : result[0][0].RESTAURANT_NAME,
        restaurantAddress  : result[0][0].RESTAURANT_ADDRESS,
        restaurantPhone    : result[0][0].RESTAURANT_PHONE,
        operationTime      : result[0][0].OPERATION_TIME,
        restaurantImage1   : result[0][0].RESTAURANT_IMAGE_1,
        restaurantImage2   : result[0][0].RESTAURANT_IMAGE_2,
        restaurantImage3   : result[0][0].RESTAURANT_IMAGE_3,
        restaurant_Image4  : result[0][0].RESTAURANT_IMAGE_4,
        restaurantId       : result[0][0].RESTAURANT_ID,
        gpsX               : result[0][0].GPS_X,
        gpsY               : result[0][0].GPS_Y
      });
    } else {
      res.status(errCode.OK);
      res.json({
        errCode: errCode.BADREQUEST,
        msg: "메뉴정보가 존재하지 않습니다."
      });
    }

  } catch (err) {

    throw err

  } finally {

    connection.release();

  }
	
}))

// 메뉴 업데이트
router.put('/api/menu', asyncHandler(async (req, res, next) => {
  
  const menuId = req.body.menuId;

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
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;

  const connection = await pool.getConnection();

  const queryString = 
  `UPDATE MENU 
	    SET PRICE = ?
		    , ORIGINAL_IMAGE = ?
		    , CONTENTS = ?
		    , START_DATE = ?
		    , END_DATE = ?
		    , MODIFIED_TIME = NOW()
    WHERE MENU_ID = ?`
  
   await connection.excute(queryString
    , [ price
    , menuImage
    , contents
    , startDate
    , endDate
    , menuId ]
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

// 메뉴 리스트 조회
router.get('/api/menu', asyncHandler(async (req, res, next) => {

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
  
    const connection = await pool.getConnection();

    try {

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
             LIMIT ?, ?`                                                                              
    
      let result = await pool.query(queryString, [firstPostNum , pageCnt])

      console.log('result[0] : ', result[0])

      if (result[0].length > 0) {
        res.status(errCode.OK);
        res.json({
          errCode: errCode.OK,
          menuList: result[0]
        });
      } else {
        res.status(errCode.OK);
        res.json({
          errCode: errCode.BADREQUEST,
          msg: "식당이 존재하지 않습니다."
        });
      }

    } catch (err) {

      throw err;

    } finally {

      connection.release();

    }
    
}))
module.exports = router;