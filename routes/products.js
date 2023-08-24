const {Product} = require('../models/product');
const {Category} =require('../models/category');
const S3 = require("aws-sdk/clients/s3.js");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();

const config = {
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
  

const S3_BUCKET_NAME = process.env.CYCLIC_BUCKET_NAME;
const fs = require("@cyclic.sh/s3fs/promises")(S3_BUCKET_NAME, config);



// const upload = multer({
//     storage :multerS3({
//         s3 ,
//         bucket :'cyclic-plum-courageous-cormorant-eu-west-1',
//         metadata :function(req,file,cb){
//             cb(null ,{fieldName :file.fieldname})
//             },
//             key :function(req,file,cb){
//                 cb(null , Date.now().toString() + "-" + file.originalname);
//             },
//     })
//  })

router.post(`/`, async(req, res) =>{
    const category = await Category.findById(req.body.category);

    if (!req.body.image) {
        return res.status(400).json({ error: 'Image data is missing in the request.' });
      }


      const imageData = req.body.imageData;
      const objectKey = `uploaded-images/${Date.now()}.jpg`; // Unique object key
    
      // Decode the base64 image data into a Buffer
      const imageBuffer = Buffer.from(imageData, 'base64');

      
  // Set up the parameters for the S3 upload
  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Body: imageBuffer
  };
    
  const filePath ='';
  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading image to S3:', err);
      return res.status(500).json({ error: 'Failed to upload image to S3.' });
    } else {
      console.log('Image uploaded successfully to S3:', data.Location);
      filePath =data.location;
      return res.status(200).json({ imageUrl: data.Location });
    }
  });
    

   console.log(filePath);
 
   
    if(!category)
    return res.status(500).send('Invalid Category');

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image:filePath, // Include the full image URL
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })
  
     product = await product.save();
     if(!product)
     return res.status(500).send('The product cannot be created');

     res.send(product);
    })

router.get(`/`, async (req, res) =>{
    let filter ={};

    if(req.query.categories){
        filter = {category : req.query.categories.split(',')}
    }
    const productList = await Product.find(filter).populate('category');
  // Read the image file
   
    if(!productList) {
        res.status(500).json({success: false})
    } 
    res.send(productList);
})


router.get(`/:id`, async (req, res ) =>{
    const product = await Product.findById(req.params.id).populate('category');

    if(!product) {
       return res.status(500).json({success: false})
    } 
   return res.status(200).send(product);
})

router.get(`/get/count`, async (req, res) =>{
    const productCount = await Product.countDocuments();

    if(!productCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        count:productCount});
})
router.get(`/get/featured/:count`, async (req, res) =>{
    const count =req.params.count ? req.params.count :0;
    const products = await Product.find({isFeatured : true}).limit(+count);
    
    if(!products) {
        res.status(500).json({success: false})
    } 
    res.send(products);
})

//,upload.single('image')

router.put(`/:id`,async(req,res)=>{

    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');
   
    const file = req.file;
    let imagepath;

    if(file){
        const filename = file.filename;
        // const basePath =`${req.protocol}://${req.get('host')}/public/upload/`;
        // imagepath =  `${basePath}${filename}` ;
        const params = {
            Bucket:process.env.CYCLIC_BUCKET_NAME,      // bucket that we made earlier
            Key:req.file.originalname,               // Name of the image
            Body:req.file.buffer,                    // Body which will contain the image in buffer format
            ACL:"public-read-write",                 // defining the permissions to get the public link
            ContentType:"image/jpeg"                 // Necessary to define the image content-type to view the photo in the browser with the link
        };
         s3.upload(params,async (error,data)=>{
            if(error){
                res.status(500).send({"err":error})  
            }
        })
    }
    else{
        imagepath = product.image;
    }

   
     

    const updateProduct =await Product.findByIdAndUpdate(req.params.id ,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
    },
    {new :true}
    );
    if(!updateProduct){
     res.status(404).json({sucess:false,message:'product not fond'});
    }
    res.status(200).send(updateProduct);
})

router.put(`/gallery-images/:id`,
//upload.array('image' , 4),
async(req,res)=>{

    if(!mongoose.isValidObjectId(req.params.id)){
        return  res.status(500).send('Invalid product');
    }

    let imagePaths =[];
    const files = req.files;
    const basePath =`${req.protocol}://${req.get('host')}/public/upload`;
    if(files){
       files.map(file =>{
            imagePaths.push(`${basePath} ${file.filename}`);
        })
    }

    const product =await product.findByIdAndUpdate(req.params.id ,
        {
           images : imagePaths
    },
    {new :true}
    );
    if(!product){
     res.status(404).json({sucess:false,message:'product not fond'});
    }
    res.status(200).send(product);

})

router.delete('/:id',(req,res)=>{
    Product.findByIdAndRemove(req.params.id).then(product =>{
        if(product){
            return res.status(200).json({sucess:true , message:'product deleted sucessfully'})
        }
        else{
            return res.status(404).json({sucess:false , message :'product not deleted'})
        }
    })
    .catch(err =>{
        return res.status(400).json({sucess:false ,error : err});
    })
})

module.exports =router;