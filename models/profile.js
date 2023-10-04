const mongoose = require('mongoose');

const profileSchema = mongoose.Schema({
    fbLink :{
        type: String,
        required : true
    },
    instaLink :{
        type: String
    }
})

profileSchema.virtual('id').get(function(){
    return this._id.toHexString();
} )

profileSchema.set('toJSON' ,{
    virtuals : true,
})

exports.Profile = mongoose.model('Profile', profileSchema);
