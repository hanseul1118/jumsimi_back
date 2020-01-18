const pool = require('../../../databaseConnect.js')
const asyncHandler = require('express-async-handler')
const express = require('express')
const router = express.Router()

// const tokenHandler = require(__dirname + "/middleware/tokenHandler")

router.get('/createRestaurant', asyncHandler(async (req, res, next) => {
    // Connections are Automatically Released.
    await pool.query('SELECT * FROM USER;', function (err, result, feilds) {
        if (err) throw new Error (err)
        console.log(result)
    })
	
}))

module.exports = router;