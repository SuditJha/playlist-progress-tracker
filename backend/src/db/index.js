import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

const dbConnect = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connection successfully established:\nDB HOST:  ${connectionInstance.connection.host}\n`);
    } catch (error) {
        console.error("MongoDB connection FAILED: ");
        console.error(error);
        process.exit(1);
    }
}

export default dbConnect;
