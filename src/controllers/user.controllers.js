import { asynchandler } from "../utils/asynchandler.js";
import { API_ERROR } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser=asynchandler(async (req,res)=>{

    const {fullName,userName,email,password}=req.body
   
    if([fullName,userName,email,password].some((fields)=>
        fields?.trim()===""
    )){
        throw new API_ERROR(400,"Fields are empty")
    }
  
  const existedUser=  User.findOne(
        {
            $or:[{userName},{email}]
        }
    )

    if(existedUser){
        throw new API_ERROR(409,"User with this email or username exists already")
    }
  
    const avatarlocalfilepath=req.files?.avatar[0]?.path  
    const coverImagelocalfilepath=req.files?.coverImage[0]?.path

    if(!avatarlocalfilepath){
        throw new API_ERROR(400,"Avatar Image is required")
    }



   const avatar= await uploadOnCloudinary(avatarlocalfilepath)
   const coverImage= await uploadOnCloudinary(coverImagelocalfilepath)


   if(!avatar){
    throw new API_ERROR(400,"Avatar Image is required")

   }
   

   User.create({
    fullName,
    email,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    password,
    userName:userName.toLowerCase()

   })
})

export {registerUser}