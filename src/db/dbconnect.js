import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB=async ()=>{
 
try {
  const connectionInstance= await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`);
  console.log(`Database connected !! DB hots: ${connectionInstance.connection.host}`);

    
} catch (error) {
    console.log("Monho Db connection error :", error);
    process.exit(1);
    
}
 

}

export default connectDB