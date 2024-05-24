import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET 
});

const uploadOnCloudinar= async(localFilePath)=> {
    try {
        if(!localFilePath) return null;
         const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
         })

         console.log("file uploaded on cloudinary",response.url)
        
    } catch (error) {

        fs.unlink(localFilePath)  //unlinking local file path
        return null
        
    }
}

export {uploadOnCloudinar}