const {Product} = require('../models/product');
const {Category} =require('../models/category');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();

// Configure AWS SDK
const s3Client = new S3Client({
    region: "eu-west-1"
});

// Configure multer for file upload
const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: "cyclic-plum-courageous-cormorant-eu-west-1",
        acl: "public-read", // Make uploaded file public-readable (optional)
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + "-" + file.originalname);
        },
    }),
});


router.post(`/`,upload.single('file'), async(req, res) =>{
    const category = await Category.findById(req.body.category);

   // Get the file path from the request
   const filePath = req.file.location;
   console.log(filePath);

    const file = req.file;
    
    if(!file) return res.status(400).send('file not found');
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



router.put(`/:id`,upload.single('image'),async(req,res)=>{

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
upload.array('image' , 4),
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