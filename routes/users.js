const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

router.get(`/`, async (req, res) =>{
    const user = await User.find();

    if(!user) {
        res.status(404).json({sucess:false,message:'user not  not fond'});
    } 
    res.send(user);
})

router.get(`/:id`, async (req, res) =>{
    const user = await User.findById(req.params.id);

    if(!user) {
        res.status(500).json({success: false})
    } 
    res.send(user);
})


router.post(`/`, async (req, res) =>{
    let user = new User({
        name:req.body.name,
        email : req.body.email,
        passwordHash :bcrypt.hashSync(req.body.password,10),
        phone:req.body.phone,
        isAdmin : req.body.isAdmin,
        street : req.body.street,
        apartment:req.body.apartment,
        zip : req.body.zip,
        city : req.body.city,
        country : req.body.country

       
    })
    user= await user.save();

    if(!user) {
        res.status(404).send('user not added');
    } 
    res.send(user);
})

router.put(`/:id`,async(req,res)=>{

    const userExist = await User.findById(req.params.id);
    let newPassworder

    if(req.body.password){
        newPassworder = bcrypt.hashSync(req.body.password,10);
    }else{
        newPassworder = userExist.passwordHash;
    }

    const user =await User.findByIdAndUpdate(req.params.id ,
        {
            name:req.body.name,
            email : req.body.email,
            passwordHash :newPassworder,
            phone:req.body.phone,
            isAdmin : req.body.isAdmin,
            street : req.body.street,
            apartment:req.body.apartment,
            zip : req.body.zip,
            city : req.body.city,
            country : req.body.country
    },
    {new :true}
    );
    if(!user){
     res.status(404).json({sucess:false,message:'category not fond'});
    }
    res.status(200).send(user);
})

router.post('/login' ,async(req,res)=>{
    console.log('returning a valid user');
    const user = await User.findOne({email : req.body.email});
    if(!user){
        return res.status(404).send('user not found')
    }
    
    if(user && bcrypt.compareSync(req.body.password,user.passwordHash)){
        const secret = process.env.secret;
        const token = jwt.sign({
            user : user.id,
            isAdmin :user.isAdmin
        },
        secret,
        {expiresIn :'1d'}
        )
       
        res.status(200).send({user : user.email ,token : token});
    }
    else{
        res.status(400).send('password is wrong');
    }
})

router.get('/get/count',async (req,res)=>{
    const userCount = await User.countDocuments();

    if(!userCount){
        res.send().status(500).json({sucess : false});
    }
     res.send({count :userCount});
})

router.delete('/:id',(req,res)=>{
    User.findByIdAndRemove(req.params.id).then(user =>{
        if(user){
            return res.status(200).json({sucess:true , message:'user deleted sucessfully'})
        }
        else{
            return res.status(404).json({sucess:false , message :'user not deleted'})
        }
    })
    .catch(err =>{
        return res.status(400).json({sucess:false ,error : err});
    })
})

module.exports =router;