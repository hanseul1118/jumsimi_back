const express = require('express');
const app = express();
const mysql = require('mysql');
const connectinSettingInfo = require(__dirname + '/connectionSetting.json');

const customerMenuApi = require('./routes/API/customer/MenuApi.js');
const customerRestaurantApi = require('./routes/API/customer/RestaurantApi.js');
const ownerMenuApi = require('./routes/API/owner/MenuApi.js');
const ownerRestaurantApi = require('./routes/API/owner/RestaurantApi.js');
const ownerUserApi = require('./routes/API/owner/UserApi.js');

const connection = mysql.createConnection({
    host: connectinSettingInfo.host,
    port: connectinSettingInfo.port,
    user: connectinSettingInfo.user,
    password: connectinSettingInfo.password,
    database: connectinSettingInfo.database,
    connectionLimit: 15,
    queueLimit: 30,
    acquireTimeout: 30000
});

connection.connect();

connection.query("SELECT * FROM USER;", (err, result) => {
    if (err) {
        console.log(err);
    }
    console.log('test');
    console.log(result);
    connection.end();
});

app.listen(3001, function(){
    console.log("Express server has started on port 3001");
});