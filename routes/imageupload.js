const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");


// create s3 instance using S3Client 
// (this is how we create s3 instance in v3)
const s3 = new S3Client({
    credentials: {
        accessKeyId: 'ASIATM5NDY7N5C7QXK5K', // store it in .env file to keep it safe
        secretAccessKey:  'kkYDYng7C48tDGpeOy73qCfXIwlJMJZv3qidzNy5',
    },
    region:  process.env.AWS_REGION // this is the region that you select in AWS account
})

const config = {
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
}

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME
const fs = require('@cyclic.sh/s3fs/promises')(S3_BUCKET_NAME, config)

const user = {
    name: 'Ashik Nesin',
    website: "https://AshikNesin.com"
}



const s3Storage = multerS3({
    s3: s3, // s3 instance
    bucket: "my-images", // change it as per your project requirement
    acl: "public-read", // storage access type
    metadata: (req, file, cb) => {
        cb(null, {fieldname: file.fieldname})
    },
    key: (req, file, cb) => {
        const fileName = Date.now() + "_" + file.fieldname + "_" + file.originalname;
        cb(null, fileName);
    }
});

// function to sanitize files and send error for unsupported files
function sanitizeFile(file, cb) {
    // Define the allowed extension
    const fileExts = [".png", ".jpg", ".jpeg", ".gif"];

    // Check allowed extensions

    const isAllowedExt = true;
    // const isAllowedExt = fileExts.includes(
    //     path.extname(file.originalname.toLowerCase())
    // );

    // Mime type must be an image
    const isAllowedMimeType = file.mimetype.startsWith("image/");

    if (isAllowedExt && isAllowedMimeType) {
        return cb(null, true); // no errors
    } else {
        // pass error msg to callback, which can be displaye in frontend
        cb("Error: File type not allowed!");
    }
}

// our middleware
const uploadImage = multer({
    storage: s3Storage,
    fileFilter: (req, file, callback) => {
        sanitizeFile(file, callback)
    },
    limits: {
        fileSize: 1024 * 1024 * 2 // 2mb file size
    }
})

module.exports = uploadImage;