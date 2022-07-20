const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhandler")
const catchAsyncErros = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail")
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const crypto = require("crypto");
const { json } = require("body-parser");
const { rmSync } = require("fs");


//Register a User

exports.registerUser = catchAsyncErros(async(req,res,next)=>{
    const {name,email,password} = req.body;

    const user = await User.create({
        name,email,password,
        avatar:{
          public_id:"this is a sample id",
          url:"profilepicUrl"  
        }
    });
    sendToken(user,201,res);
});

//Login User
exports.loginUser = catchAsyncErros(async (req,res,next)=>{
    const {email,password} = req.body;
    //checking if user has given password and email both

    if(!email || !password){
        return next(new ErrorHandler("Please Enter Email and Password"));
    }

    const user = await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid Email or Password",401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    console.log("isPasswordMatched=",isPasswordMatched)
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email and Password", 401));
    }
   
    sendToken(user,200,res);

})

// Logout User

exports.logout = catchAsyncErros(async(req,res,next)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
})

//Forget Password

exports.forgotPassword = catchAsyncErrors(async (req,res,next)=>{
    const user = await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHandler("User not found", 404));
    }

    //Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();
    await user.save({validateBeforeSave:false});

    const resetPasswordUrl = `${req.protocol}://${req.get(
        "host"
        )}/api/v1/password/reset/${resetToken}`;

    const message = `Follow this link to reset your password \n\n ${resetPasswordUrl}\n\n If you have not requested password reset please ignore.`
    try{
        await sendEmail({
            email:user.email,
            subject:`Ecommerce Password Recovery`,
            message
        });

        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} successfully.`
        });

    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire=undefined;
        await user.save({validateBeforeSave:false});

        return next(new ErrorHandler(error.message, 500));
    }

})

//Reset Password

exports.resetPassword = catchAsyncErrors(async(req,res,next)=>{
    //creating token hash
    const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{ $gt:Date.now() },
    });

    if(!user){
        return next(new ErrorHandler("Reset Password Token is invalid or has expired"))
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password doesn't match"))
  
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire=undefined;

    await user.save();

    sendToken(user,200,res);
})


//Get User Detail
exports.getUserDetails = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success:true,
        user
    })
})

//change password
exports.changePassword = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id).select("+password");
    
    if(!user){
        return next(new ErrorHandler("Invalid Email or Password",401));
    }

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    
    if(!isPasswordMatched){
        return next(new ErrorHandler("old password is incorrect", 400));
    }
    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler("Password doesn't match"))
  
    }
    user.password=req.body.newPassword;
    await user.save()

    sendToken(user,200,res);
})


//update profile
exports.updateProfile = catchAsyncErrors(async(req,res,next)=>{
    
    const newUserData={
        name:req.body.name,
        email:req.body.email
    }

    //we will add cloudinary later
    
    const user = await User.findByIdAndUpdate(req.user.id, newUserData,{
        new: true,
        runValidators:true,
        useFindAndModify:false,
    });
    
    sendToken(user,200,res);
})

//get all users (admin)
exports.getAllUser = catchAsyncErrors(async(req,res,next)=>{
    const users= await User.find();


    res.status(200).json({
        users,
        success:true
    });

})

//get single user (admin)
exports.getSingleUser = catchAsyncErrors(async(req,res,next)=>{
    const user= await User.findById(req.params.id);

    if(!user){
        return next(
            new ErrorHandler(`User doesn't exist with ID ${req.params.id}`)
            );
    }

    res.status(200).json({
        user,
        success:true
    });

})
    

//update profile by ADMIN
exports.updateUser = catchAsyncErrors(async(req,res,next)=>{
    
    const newUserData={
        name:req.body.name,
        email:req.body.email,
        role:req.body.role
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, newUserData,{
        new: true,
        runValidators:true,
        useFindAndModify:false,
    });
    
    res.status(200).json({
        user,
        success:true
    })
})


//delete profile by ADMIN
exports.deleteUser = catchAsyncErrors(async(req,res,next)=>{
    
   
    const user = await User.findByIdAndUpdate(req.params.id);

    if(!user){
        return next(
            new ErrorHandler(`User doesn't exist with ID ${req.params.id}`)
            );
    }

    await user.remove();
    
    res.status(200).json({
        success:true,
        message:"user deleted successfully"
    })
})
