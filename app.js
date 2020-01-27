const express = require('express');
const app = express();

const customerMenuApi = require('./routes/API/customer/MenuApi.js');
const customerRestaurantApi = require('./routes/API/customer/RestaurantApi.js');
const ownerMenuApi = require('./routes/API/owner/MenuApi.js');
const ownerRestaurantApi = require('./routes/API/owner/RestaurantApi.js');
const ownerUserApi = require('./routes/API/owner/UserApi.js');

app.use(customerMenuApi);
app.use(customerRestaurantApi);
app.use(ownerMenuApi);
app.use(ownerRestaurantApi);
app.use(ownerUserApi);

app.listen(3001, function(){
    console.log("Express server has started on port 3001");
});