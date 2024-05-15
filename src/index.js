//require('dotenv').config({path: '/.env'})
import dotenv from "dotenv"
import connectDB from "./db/dbconnect.js";
import { app } from "./app.js";

dotenv.config({path:"./env"});



connectDB()
.then(()=>{
    app.on("error",()=>{
        console.log("error :",console.error());
        throw error;

    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log("Server is listening at port"+process.env.PORT);
    })



})
.catch((err)=>{

  console.log("MOngo DB Connection Error :",err);

})

