import { User } from "../models/user.model.js";
import { API_ERROR } from "../utils/ApiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

 export const verifyJwt=asynchandler(async(req,res,next)=>{


    try {
     const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
     console.log(token)

     if(!token){
        throw new API_ERROR(401,"Unauthorized Request")
     }
      
     const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    const user= await User.findById(decodedToken?._id)

    if(!user){
        throw new API_ERROR(401,"Invalid Acesss Token")
    }

    req.user=user
    next()



        
    } catch (error) {
        throw new API_ERROR(401,error?.message || "Invalid user Token")
        
    }



 })