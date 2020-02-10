const mysql = require('mysql2/promise');
const connectinSettingInfo = require('../jumsimi_back_config/connectionSetting.json');

const pool = mysql.createPool({
  host: connectinSettingInfo.host,
  port: connectinSettingInfo.port,
  user: connectinSettingInfo.user,
  password: connectinSettingInfo.password,
  database: connectinSettingInfo.database,
  connectionLimit: 100,
  multipleStatements: true,
  ssl : false
})

module.exports = pool