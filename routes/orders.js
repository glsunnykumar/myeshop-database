const {Order} = require('../models/order');
const express = require('express');
const router = express.Router();
const {OrderItem} = require('../models/order-item');
const {Product} = require('../models/product');
const stripe = require('stripe')('sk_test_51IvzpLSDJAf7L2TcHSZH9OPgQEj8wojPxW5Z5yeOQESlaJlZnnBRA3Lsat04xlISCdg81oKfz94wD34OpqUnvMGi008c9UK6ri');

router.get(`/`, async (req, res) =>{
    const orderList = await Order.find().populate('user','name').sort({'dateOrdered' :-1});

    if(!orderList) {
        res.status(500).json({success: false})
    } 
    res.send(orderList);
})

router.get(`/:id`, async (req, res) =>{
    const order = await Order.findById(req.params.id)
    .populate('user','name')
    .populate({path :'orderItems' ,populate :'product'});

    if(!order) {
        res.status(500).json({success: false})
    } 
    res.send(order);
})

router.get('/get/totalsales' , async(req,res)=>{
    const totalSales = await Order.aggregate([
        {$group : {_id:null ,totalSales:{$sum:'$totalPrice'}}}
    ])

    if(!totalSales){
        return res.status(400).send('The order sales cannot be generated');
        
    }
    res.send({totalSales:totalSales.pop().totalSales});
})

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Order.countDocuments();
    if(!orderCount) {
        res.status(500).json({success: false})
    } 
    res.send({
       
        count:orderCount});
})

router.get(`/get/userorder/:userid`, async (req, res) =>{
    const userOrderList = await Order.find(req.params.userid)
    .populate
    (
        {path :'orderItems' ,populate :{
            path :'product' ,populate :'category'
        }}.sort({'dateOrdered' :-1})
    );
    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})


router.post(`/`, async (req, res) =>{

    const orderItemsIds =Promise.all(req.body.orderItems.map(async (orderItem) =>{
        let newOrderItem = new OrderItem({
            quantity : orderItem.quantity,
            product : orderItem.product
        })
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))

    const orderItemsResolved = await orderItemsIds;
    const totalPrices = await Promise.all(orderItemsResolved.map(async (orderItemId) =>{
         const orderItem = await OrderItem.findById(orderItemId).populate('product' ,'price');
     
         const totalPrice = await orderItem.product.price * orderItem.quantity;
         return totalPrice;
    }))

    const totalPrice = totalPrices.reduce((a,b) => a+b,0);

    let order = new Order({
        orderItems:orderItemsResolved,
        shippingAddress1 : req.body.shippingAddress1,
        shippingAddress2 : req.body.shippingAddress2,
        city:req.body.city,
        zip : req.body.zip,
        country:req.body.country,
        phone : req.body.phone,
        status : req.body.status,
        totalPrice : totalPrice,
        user:req.body.user
    })
    order= await order.save();

    if(!order) {
        res.status(404).send('order not added');
    } 
    res.send(order);
})

router.post('/create-checkout-session',async(req,res)=>{
    const orderItem = req.body;
    console.log(orderItem);
    if(!orderItem){
        res.status(400).send('check-out session can not be created');
    }
    const lineItems =await Promise.all(orderItem.map(async orderitem =>{
 
     const product =   await Product.findById(orderitem.product);

     console.log(product);
   
        return {

            
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                // price:`pr_`+ product.price,
                // quantity: orderitem.quantity,
              
                price_data :{
                    currency :'inr',
                    product_data :{
                        name : product.name,
                    },
                    unit_amount : product.price *100,
                },
                quantity :orderitem.quantity
        }
    }))
    const session =await stripe.checkout.sessions.create({
        payment_method_types : ['card'],
        line_items :lineItems,
        mode :'payment',
        success_url :'http://localhost:4200/success',
        cancel_url :'http://localhost:4200/erroe'
    })

    res.json({id : session.id});
})

router.put(`/:id`,async(req,res)=>{
    const order =await Order.findByIdAndUpdate(req.params.id ,
        {
         status : req.body.status
    },
    {new :true}
    );
    if(!req.body.status){
     res.status(404).json({sucess:false,message:'status not fond'});
    }
    res.status(200).send(order);
})

router.delete('/:id', (req,res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order){
            await order.orderItems.map(async orderItem =>{
                await OrderItem.findByIdAndRemove(orderItem);
            })
            return res.status(200).json({sucess:true , message:'order deleted sucessfully'})
        }
        else{
            return res.status(404).json({sucess:false , message :'order not deleted'})
        }
    })
    .catch(err =>{
        return res.status(400).json({sucess:false ,error : err});
    })
})



module.exports =router;