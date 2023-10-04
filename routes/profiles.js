const {Profile} = require('../models/profile');
const express = require('express');
const router = express.Router();


router.get(`/`, async (req, res) =>{
    const profileList = await Profile.find();

    if(!profileList) {
        res.status(500).json({success: false})
    } 
    res.status(200).send(profileList);
})

router.get(`/:id`,async(req,res)=>{
    const profile =await Profile.findById(req.params.id);
    if(!profile){
     res.status(404).json({sucess:false,message:'profile not fond'});
    }
    res.status(200).send(category);
})

router.put(`/:id`,async(req,res)=>{
    const profile =await Profile.findByIdAndUpdate(req.params.id ,
        {
        fbLink: req.body.fbLink,
        instaLink : req.body.instaLink
    },
    {new :true}
    );
    if(!profile){
     res.status(404).json({sucess:false,message:'profile not fond'});
    }
    res.status(200).send(profile);
})

router.post(`/`, async (req, res) =>{
    let profile = new Profile({
        fbLink:req.body.fbLink,
        instaLink : req.body.instaLink
    })
    profile= await Profile.save();

    if(!category) {
        res.status(404).send('profile not added');
    } 
    res.send(profile);
})

router.delete('/:id',(req,res)=>{
    Profile.findByIdAndRemove(req.params.id).then(profile =>{
        if(profile){
            return res.status(200).json({sucess:true , message:'profile details deleted sucessfully'})
        }
        else{
            return res.status(404).json({sucess:false , message :'profile not deleted'})
        }
    })
    .catch(err =>{
        return res.status(400).json({sucess:false ,error : err});
    })
})

module.exports =router;