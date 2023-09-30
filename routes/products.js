const { Product } = require("../models/product");
const { Category } = require("../models/category");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require('fs');
var path = require("path");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    
      const isValid =  FILE_TYPE_MAP[file.mimetype];
      let UploadError = new Error('invalid image type');
      if(isValid){
        UploadError = null;
      }
      cb(UploadError, 'public/upload')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-');  
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
  })
  
  const uploadOptions = multer({ storage: storage })

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
    // const productCount = await Product.countDocuments();

    // if(!productCount) {
    //     res.status(500).json({success: false})
    // } 
    // res.status(200).send({
    //     count:productCount});


        try {
            const productCount = await Product.countDocuments();
    
            res.status(200).json({ count: productCount });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: "Internal server error" });
        }     
})
router.get(`/get/featured/:count`, async (req, res) =>{
    const count =req.params.count ? req.params.count :0;
    const products = await Product.find({isFeatured : true}).limit(+count);
    
    if(!products) {
        res.status(500).json({success: false})
    } 
    res.send(products);
})

router.post(`/`,uploadOptions.single('image'), async(req, res) =>{
    
    const category = await Category.findById(req.body.category);
    const file = req.file;
    const fileName = file.filename;
    
    if(!file) return res.status(400).send('file not found');
    console.log(`${req.protocol}`);
    const basePath =`${req.protocol}://${req.get('host')}/public/upload/`;
    if(!category)
    return res.status(500).send('Invalid Category');
    console.log(`${basePath}${fileName}`);

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image:`${basePath}${fileName}` ,
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

router.put(`/:id`,uploadOptions.single('image'),async(req,res)=>{

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
        const basePath =`${req.protocol}://${req.get('host')}/public/upload/`;
        imagepath =  `${basePath}${filename}` ;
    }
    else{
        imagepath = product.image;
    }

   
     const imageArray = [];
     imageArray.push(imagepath);

    const updateProduct =await Product.findByIdAndUpdate(req.params.id ,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            images:imageArray,
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
uploadOptions.array('images' , 4),
async(req,res)=>{
    console.log('return');
    if(!mongoose.isValidObjectId(req.params.id)){
     
        return  res.status(500).send('Invalid product');
    }

    let imagePaths =[];
    const files = req.files;
    console.log(files);
    const basePath =`${req.protocol}://${req.get('host')}/public/upload/`;
    if(files){
       files.map(file =>{
            imagePaths.push(`${basePath}${file.filename}`);
        })
    }

    const product =await Product.findByIdAndUpdate(req.params.id ,
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
        const folderPathDisk = path.join(__dirname,'..', '/public/upload');
        const folderPath =`${req.protocol}://${req.get('host')}/public/upload/`;
        if(product){
           let imagePath = product.image;
           if(imagePath){
         
           console.log(folderPathDisk);
           console.log(folderPath);
           // Use string manipulation to remove the base path
           const trimmedUrl = imagePath.replace(folderPath, '');
           fs.unlink(path.join(folderPathDisk, trimmedUrl), (err) => {
            if (err) {
              console.error(`Error deleting file: ${err}`);
            } else {
              console.log(`File ${trimmedUrl} has been deleted.`);
            }
          });
        }

        let imageGalleryPath = product.images;
        removeImagesFromTheGalleryProduct(imageGalleryPath,folderPathDisk,folderPath);
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

function removeImagesFromTheGalleryProduct(filePathsToDelete,folderPathDisk,folderPath){

    filePathsToDelete.forEach(filePath => {
        // Use string manipulation to remove the base path
        const trimmedUrl = filePath.replace(folderPath, '');

        // Construct the absolute file path
        const absoluteFilePath = path.join(folderPathDisk, trimmedUrl); 
      
        // Check if the file exists
        if (fs.existsSync(absoluteFilePath)) {
          try {
            // Delete the file
            fs.unlinkSync(absoluteFilePath);
            console.log(`Deleted file: ${filePath}`);
          } catch (err) {
            console.error(`Error deleting file: ${err}`);
          }
        } else {
          console.warn(`File not found: ${filePath}`);
        }
      });

}

module.exports =router;