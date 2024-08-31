import { app } from "./app.js";
import dbConnect from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./env"
});

dbConnect()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`\nServer is running on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log(`\MongoDB connection failed: ${error.message}`);
    });
