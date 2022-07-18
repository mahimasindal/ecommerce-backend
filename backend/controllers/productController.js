const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler")
const catchAsyncErros = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");


//Create Product --Admin
exports.createProduct=  catchAsyncErros(async(req,res,next)=>{
        req.body.user = req.user.id;
        const product = await Product.create(req.body);
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
        productCount
    })

})

