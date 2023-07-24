const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const autJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require('dotenv/config');


app.use(cors());
app.options('*', cors())

//Middleware
app.use(express.json());
app.use(morgan('tiny'));
//app.use(autJwt());
app.use('/public/upload',express.static(__dirname +'/public/upload'));
app.use(errorHandler);

//routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');



const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);

const PORT =process.env.PORT || 3000 ;
//database
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DB_NAME
})
.then(()=>{
    console.log('Database Connection is ready...')
    app.listen(PORT,()=>{
        console.log('server is running');
    })
})
.catch((err)=> {
    console.log(err);
})



