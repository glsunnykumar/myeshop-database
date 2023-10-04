const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const autJwt = require('./helpers/jwt');
const bodyParser = require('body-parser');
const errorHandler = require('./helpers/error-handler');
require('dotenv/config');


app.use(cors());
app.options('*', cors())

//Middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(bodyParser.json());
//app.use(autJwt());
app.use('/public/upload',express.static(__dirname +'/public/upload'));
app.use(errorHandler);

//routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profiles');



const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/profiles`, profileRoutes);

const PORT =process.env.PORT || 3000 ;

const connectDB = async () => {
    try {
      const conn = await mongoose.connect('mongodb+srv://EshopOwner:febXI2lNliIYGLTJ@cluster0.cfx2tgd.mongodb.net/', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'eshop-database'
    });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

  //Connect to the database before listening
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    })
})




