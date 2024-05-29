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


export {registerUser,
    loginUser,
    logOutuser,
    refreshAcessToken
}