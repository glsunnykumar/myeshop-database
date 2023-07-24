const {Category} = require('../models/category');
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) =>{
    const categoryList = await Category.find();

    if(!categoryList) {
        res.status(500).json({success: false})
    } 
    res.status(200).send(categoryList);
})

router.get(`/:id`,async(req,res)=>{
    const category =await Category.findById(req.params.id);
    if(!category){
     res.status(404).json({sucess:false,message:'category not fond'});
    }
    res.status(200).send(category);
})

router.put(`/:id`,async(req,res)=>{
    const category =await Category.findByIdAndUpdate(req.params.id ,
        {
        name: req.body.name,
        icon : req.body.icon,
        color : req.body.color
    },
    {new :true}
    );
    if(!category){
     res.status(404).json({sucess:false,message:'category not fond'});
    }
    res.status(200).send(category);
})

router.post(`/`, async (req, res) =>{
    let category = new Category({
        name:req.body.name,
        icon : req.body.icon,
        color : req.body.color
    })
    category= await category.save();

    if(!category) {
        res.status(404).send('catergory not added');
    } 
    res.send(category);
})

router.delete('/:id',(req,res)=>{
    Category.findByIdAndRemove(req.params.id).then(category =>{
        if(category){
            return res.status(200).json({sucess:true , message:'category deleted sucessfully'})
        }
        else{
            return res.status(404).json({sucess:false , message :'category not deleted'})
        }
    })
    .catch(err =>{
        return res.status(400).json({sucess:false ,error : err});
    })
})

module.exports =router;