const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler")
const catchAsyncErros = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");


//Create Product --Admin
exports.createProduct=  catchAsyncErros(async(req,res,next)=>{
        req.body.user = req.user.id;
        const product = await Product.create(req.body);
        //console.log("product =", await Product.findById(product._id))
        res.status(201).json({
            success:true,
            product
        })
    })

//Get All Product
exports.getAllProducts = catchAsyncErros(async(req,res)=>{
        const resultPerPage = 5;
        const productCount = await Product.countDocuments();

        const apiFeature = new ApiFeatures(Product.find(),req.query)
        .search()
        .filter()
        .pagination(resultPerPage);
        const products = await apiFeature.query;
        
        res.status(200).json({
            success:true,
            products
        })
})

//Update Product --Admin
exports.updateProduct = catchAsyncErros(async(req,res,next)=>{

    let product= await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler("Product not found",404))
    }

    product = await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });

    res.status(200).json({
        success:true,
        product
    })
})

//Delete Product --Admin
exports.deleteProduct = catchAsyncErros(async(req,res,next)=>{
    let product = await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler("Product not found",404))
    }

   await product.remove()

    res.status(200).json({
        success:true,
        message:"Product deleted successfully"
    })
})

//Get product details
exports.getProductDetails= catchAsyncErros(async(req,res,next)=>{
    
    const apiFeature = new ApiFeatures(Product.find(),req.query)
    const product=await Product.findById(req.params.id);
    if(!product){
        return next(new ErrorHandler("Product not found",404))
    }

    res.status(200).json({
        success:true,
        product,
        //productCount
    })

})

//Create new review or update the review

exports.createProductReview = catchAsyncErros(async (req,res,next)=>{
    const {rating,comment,productId}=req.body;
    
    const review = {
        user:req.user._id,
        name:req.user.name,
        rating:Number(rating),
        comment
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
        (rev) =>rev.user.toString()===req.user._id.toString()
        );

    if(isReviewed){
        product.reviews.forEach((rev) => {
            if(rev.user.toString()===req.user._id.toString())
            (rev.rating=rating),(rev.comment=comment);
        });

    }
    else{
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    }

    let avg=0
     product.reviews.forEach(rev=>{
        avg+=rev.rating
    });
    product.ratings =avg/product.reviews.length;

    await product.save({validateBeforeSave:false});

    res.status(200).json({
        success:true
    })
})

//Get Al reviews of a product
exports.getProductReviews=catchAsyncErros(async(req,res,next)=>{

    const product =await Product.findById(req.query.id)

    if(!product){
        return next(new ErrorHandler("Product not found",404))
    }

    const reviews = product.reviews

    res.status(200).json({
        reviews,
        success:true
    })



})


//Delete review of a product
exports.deleteReview=catchAsyncErros(async(req,res,next)=>{

    const product =await Product.findById(req.query.productId)

    if(!product){
        return next(new ErrorHandler("Product not found",404))
    }

    const reviews = product.reviews.filter(
        (rev) => rev._id.toString() !== req.query.id.toString()
      );


      let avg = 0;

      reviews.forEach((rev) => {
        avg += rev.rating;
      });
    
      let ratings = 0;
    
      if (reviews.length === 0) {
        ratings = 0;
      } else {
        ratings = avg / reviews.length;
      }
    
      const numOfReviews = reviews.length;
    
      await Product.findByIdAndUpdate(
        req.query.productId,
        {
          reviews,
          ratings,
          numOfReviews,
        },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );
    

    res.status(200).json({
        success:true
    })



})

