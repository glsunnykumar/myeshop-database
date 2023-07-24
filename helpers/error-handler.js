function errorHandler(err,req,res,next){
    if(err.name ==='UnathorizedError'){
      return  res.status(401).json({message :"user is unauthorized"});
    }

    if(err.name ==='ValidationError'){
      return  res.status(401).json({message : err})
    }
    return res.status(500).json(err);
}



module.exports = errorHandler;