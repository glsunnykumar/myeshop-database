const {Product} = require('../models/product');
const {Category} =require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require("aws-sdk");
const s3 = new AWS.S3()

const FILE_TYPE_MAP ={
    'image/png':'png',
    'image/jpeg':'jpeg',
    'image/jpg':'jpg'
}


// creating the storage variable to upload the file and providing the destination folder, 
// if nothing is provided in the callback it will get uploaded in main directory

const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
})

// below variable is define to check the type of file which is uploaded

const filefilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
    
//       const isValid =  FILE_TYPE_MAP[file.mimetype];
//       let UploadError = new Error('invalid image type');
//       if(isValid){
//         UploadError = null;
//       }
//       cb(UploadError, 'public/upload')
//     },
//     filename: function (req, file, cb) {
//       const fileName = file.originalname.split(' ').join('-');  
//       const extension = FILE_TYPE_MAP[file.mimetype];
//       cb(null, `${fileName}-${Date.now()}.${extension}`);
//     }
//   })
  
 // const uploadOptions = multer({ storage: storage })


 // defining the upload variable for the configuration of photo being uploaded
const upload = multer({ storage: storage, fileFilter: filefilter });


 s3 = new S3Client({
    credentials: {
        accessKeyId: "ASIATM5NDY7NU4E4JRFT", // store it in .env file to keep it safe
        secretAccessKey: "33Nfv7rMLxKuyHdOQ15B57irpLFkcOnfhj31j0mt",
        sessionToken :"IQoJb3JpZ2luX2VjEM3//////////wEaCmFwLXNvdXRoLTEiRzBFAiEAgf3j1LYkaz4Ah/B1u+nJPEAdzFKP3/x2aI+aH7Dnkr0CIEaEuNJKjIZ6HEQmNynm0Q5aP4STvQnJnQyudAPYpB9DKrwCCIb//////////wEQABoMMjMzOTAxOTAxNzg3IgxXi1iLd2MHjavTPV0qkAJ5Xkox00MVLURH330WReJBBndDeBczhCfKACXZictUkop0Rl1zHMA++2nKWkQGwffzXfeGJZXv+KDQE+TalOa7t30otsuY7rxCeRdEfyIly7ivh9Fady7ymIqFfGI1V9xVj6JDHPpDK+aNgtAl6W+VWq04jijNYjrK/kzXInNaKD/KQ8NcRoGN2Px7V2l+XLZq7sAs+sPKdTc+PXS2c8pfXQbO2GL9oAVj1hmqPt9SPE5h0wgosBAaiNZbjlauh/ny+IiglAzRon8x0KdpyClrCX4L5MI9nPySj79rTDm4rvq3n9j84CcHF/DpDlu++Ql9JOBL+RpXq8uQJu30D/4Gk0XPtcyE6RR6Tr8y6CcFGzDj8/umBjqdAT5A8lnDL8/dOfeWCs4uTs75YymonbFYs1IBMFz/RLJQuS2eiGMkHmEPZaSOgRG9CsRUmLKxAU8V+7kyCRy/JkzYHOU9jre4mMrqk/nxP8pklVPabuhv0ipkQCoEfgecoNiOiO8H/l2FILjCB5IOWhDRfwbvTfQS+VlfDTfAuZjADRPsEWiU+4lsE6A2y/2p30vHFHxmEpaY/lbGlM4="
    },
    region: "eu-west-1" // this is the region that you select in AWS account
})

router.post(`/`,upload.single('image'), async(req, res) =>{
    const category = await Category.findById(req.body.category);
    const file = req.file;
    const fileName = file.filename;    
    if(!file) return res.status(400).send('file not found');
    // Definning the params variable to uplaod the photo

       
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
    const basePath =`${req.protocol}://${req.get('host')}/public/upload/`;
    if(!category)
    return res.status(500).send('Invalid Category');

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image:data.Location ,
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
uploadOptions.array('image' , 4),
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