const mongoose = require('mongoose');

const imageUploadSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: ''
    }
})

imageUploadSchema.virtual('id').get(function(){
    return this._id.toHexString();
} )

imageUploadSchema.set('toJSON' ,{
    virtuals : true,
})

exports.ImageUpload = mongoose.model('ImageUpload', imageUploadSchema);