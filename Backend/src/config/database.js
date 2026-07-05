import mongoose from "mongoose"
import { Config } from "./config.js";
import { seedCatalog } from "../utils/seedCatalog.js";

const ConntectToDb = ()=>{
    mongoose.connect(Config.MONGO_URI)
    .then((res)=>{
        console.log("MongoDb Connected");
        // Seed default categories only after the connection is ready, so the
        // query doesn't buffer and time out on a cold start.
        seedCatalog();
    })
    .catch((error)=>{
        console.error("MongoDB connection failed:", error.message);
    });
}

export default ConntectToDb