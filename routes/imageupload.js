const {ImageUpload} = require('../models/imageupload');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require("aws-sdk");


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // store it in .env file to keep it safe
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region : process.env.AWS_REGION

})


 // defining the upload variable for the configuration of photo being uploaded
 const upload = multer({ 
    storage: multerS3({
        s3 : s3,
        bucket :'cyclic-plum-courageous-cormorant-eu-west-1',
        metadata :function(req,file,cb){
        cb(null ,{fieldName :file.fieldname})
        },
        key :function(req,file,cb){
            cb(null ,"image.jpeg");
        },
    })
});


router.post(`/`,upload.single('image'), async(req, res) =>{
    const file = req.file;
    const fileName = file.filename;    
    if(!file) return res.status(400).send('file not found');
    // Definning the params variable to uplaod the photo

    let imageUpload = new ImageUpload({
        name: req.body.name,
        image:req.file.location 
    })

    imageUpload = await imageUpload.save();
    if(!imageUpload)
    return res.status(500).send('The product cannot be created');

    res.send(imageUpload);
})

module.exports =router;
