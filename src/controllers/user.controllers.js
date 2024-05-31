import { asynchandler } from "../utils/asynchandler.js";
import { API_ERROR } from "../utils/ApiError.js";
import { User} from "../models/user.model.js"
import multer from "multer";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { application } from "express";


const registerUser = asynchandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new API_ERROR(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new API_ERROR(409, "User with email or username already exists")
    }
    //console.log(req.files);

   
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new API_ERROR(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new API_ERROR(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new API_ERROR(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )


   
} )


const loginUser=asynchandler(async (req,res)=>{


const {username,email,password}=req.body

const generateAccessTokenAndRefreshToken=async(userId)=>{
   try {

        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
      await   user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
    
   } catch (error) {

    throw new API_ERROR(500,"Something went wrong while registering the user")
    
   }




}


if(!(username || email)){
    throw new API_ERROR(400,"Username or email is required")

}



const user=await User.findOne({
    $or :[{username},{email}]
})


if(!user){
    throw new API_ERROR(404,"User does not exist")
}


const isPasswordValid=await user.isPasswordCorrect(password)
if(!isPasswordValid){
   throw new API_ERROR(401,"Invalid User credintials")
}


const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id)

const loggedInUser=await User.findById(user._id).select("-password -refreshToken")


const options={
    httpOnly:true,
    secure:true
}


return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user:loggedInUser,
            refreshToken,
            accessToken

        },

        "User Logged In Sucessfully"
    
    )

)



})

const logOutuser=asynchandler(async(req,res)=>{

   

  const hola= await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            }

       },
       {
        new :true
       }
)

console.log(hola);



const options={
    httpOnly:true,
    secure:true
}


return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(
    new ApiResponse(
        200,
        {},
        "User Logged out Sucessfully"
    )

)

})

const refreshAcessToken=asynchandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new API_ERROR(401,"unauthorized request")
    }


    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new API_ERROR(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new API_ERROR(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new API_ERROR(401, error?.message || "Invalid refresh token")
    }


})

const changeCurrentPassword=asynchandler(async(req,res)=>{

    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)

     const isPasswordCorrect=await user.isPasswordCorrect(oldPassword) 
     if(!isPasswordCorrect){

        throw  new API_ERROR(400,"Invalid Password")
     }

     user.password=newPassword
     await user.save({validateBeforeSave:false})

     return res
     .status(200)
     .json(new ApiResponse(200,{},"Password Changed Sucessfully")
     )





})

const getCureentUser=asynchandler(async(req,res)=>{
 return res
 .status(200)
 .json(new ApiResponse (
    200,
    req.user,
    "User fetched sucessfully"
 ))
})


const upateAcoountDetails=asynchandler(async(req,res)=>{

    const {fullName,email}=req.body

    if(!fullName || !email){
        throw new API_ERROR(400,"All fields are required")
    }

    const user=User.findByIdAndUpdate(
        req.user?._id,

        {
           $set:{
            fullName :fullName,
            email:email
        }
        },

        {
            new :true
        }
    
    
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated sucessfully"))




})

const updateUserAvatar=asynchandler(async(req,res)=>{

    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new API_ERROR(400,"Avatar file missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new API_ERROR(400,"Avatar file missig")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new :true
        }
    ).select("-password") 



 return res
 .status(200)
 .json(new ApiResponse(200,user,"avatar file updated"))



})

const updateUserCoverImage=asynchandler(async(req,res)=>{

    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new API_ERROR(400,"Cover Image file missing")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new API_ERROR(400,"Cover Image file missig")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new :true
        }
    ).select("-password") 



 return res
 .status(200)
 .json(new ApiResponse(200,user,"CoverImage file updated"))



})


const getUserChannelProfile=asynchandler(async(req,res)=>{

    const {username}=req.params

    if(!username?.trim()){
        throw new API_ERROR(400,"Username not found")
    }
  
    const channel=await User.aggregate[
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                $localfield:"_id",
                foreignfield:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                $localfield:"_id",
                foreignfield:"subscriber",
                as:"subscriberdTo"

            }
        },
        {
            $addFields:{
                subcribersCount:{
                    $size: "$subscribers"
                },
                channelSubscribedCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    if:{$in : [req.user?.id ,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }

            
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                email:1,
                subcribersCount:1,
                channelSubscribedCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }

    ]


    if(!channel?.length){
        throw new API_ERROR(404,"Error while fetching the channel")
    }


    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"user channel fetched sucessfully"))



})


const watchHistory=asynchandler(async(req,res)=>{

    const  user=User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?.id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localfield :"watchHistory",
                foreignfield:"_id",
                as:"watchHistory",

                pipeline :[

                    {
                       $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignfield:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    username:1,
                                    fullName:1,
                                    avatar:1
                                }
                            },
                            {
                                $addFields:{
                                    $first:"$owner"
                                }
                            }
                        ]
                       }
                    }
                ]
            }
        }
    ] )

    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"watchHistroy Fetched Sucessfully"))

})


export {registerUser,
    loginUser,
    logOutuser,
    refreshAcessToken,
    changeCurrentPassword,
    getCureentUser,
    upateAcoountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    watchHistory
}