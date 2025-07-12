import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 8000; // Use a default port if not specified

(async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not defined in the environment variables.");
        }

        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully!");

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1); // Exit process on failure
    }
})();