// RangRiti/src/index.js

import mongoose from "mongoose";
import express from "express";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// --- ES Module Specific __dirname setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Load Environment Variables ---
dotenv.config({ path: path.join(__dirname, '../.env') });

// --- Clerk SDK Initialization ---
// Import only the Clerk class
import { Clerk } from '@clerk/clerk-sdk-node';
// Initialize the Clerk instance
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// --- Express App Setup ---
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// --- Serving Static Files for YOUR Structure ---

// Specific route for the root URL to serve landing.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
});

// General static file serving for other files in /public (like CSS, JS, other HTML files)
// This will no longer serve index.html for the '/' route because the handler above catches it first.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Specific static file serving for /static route
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

// --- MongoDB and Mongoose Setup ---

// Define a Mongoose Schema for storing additional user profile data
const userProfileSchema = new mongoose.Schema({
    clerkUserId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    userType: { type: String, enum: ['user', 'artist'], default: 'user' },
    artistName: { type: String },
    specialization: { type: String },
    city: { type: String },
    portfolioUrl: { type: String },
    bio: { type: String, default: '' },
    contactNumber: { type: String },
    socialMediaLinks: {
        instagram: { type: String },
        facebook: { type: String },
        twitter: { type: String }
    },
    profilePictureUrl: { type: String, default: '' },
    artSampleUrls: [{ type: String }],
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// --- Database Connection and Server Start ---
(async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not defined in the environment variables.");
        }

        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully!");

        // --- API Endpoint for User Registration ---
        app.post('/api/register', async (req, res) => {
            const {
                email, password, name, username, phoneNumber, // Added username and phoneNumber
                userType,
                artistName, artform, city, portfolioUrl, bio, contactNumber,
                instagram, facebook, x,
                profilePictureUrl, artSampleUrls
            } = req.body;

            // Updated validation to include username
            if (!email || !password || !name || !username) {
                return res.status(400).json({ success: false, message: 'Email, password, full name, and username are required.' });
            }

            try {
                // Prepare the data payload for Clerk
                const clerkPayload = {
                    emailAddress: [email],
                    password: password,
                    username: username,
                };

                // Conditionally add phone number if it was provided
                if (phoneNumber) {
                    clerkPayload.phoneNumber = [phoneNumber];
                }

                // Create the user in Clerk with the complete payload
                const clerkUser = await clerk.users.createUser(clerkPayload);

                console.log('User registered successfully with Clerk. User ID:', clerkUser.id);

                const userProfileData = {
                    clerkUserId: clerkUser.id,
                    email: email,
                    fullName: name,
                    // You might want to save the username to your DB as well
                    // username: username, 
                    firstName: '',
                    lastName: '',
                    userType: userType || 'user',
                    bio: bio || '',
                    profilePictureUrl: profilePictureUrl || '',
                };

                if (userType === 'artist') {
                    userProfileData.artistName = artistName || name;
                    userProfileData.specialization = artform;
                    userProfileData.city = city;
                    userProfileData.portfolioUrl = portfolioUrl;
                    userProfileData.contactNumber = contactNumber;
                    userProfileData.socialMediaLinks = {
                        instagram: instagram,
                        facebook: facebook,
                        twitter: x
                    };
                    userProfileData.artSampleUrls = artSampleUrls || [];
                }

                const newUserProfile = new UserProfile(userProfileData);
                await newUserProfile.save();

                console.log('User profile saved to MongoDB. MongoDB ID:', newUserProfile._id);

                res.status(201).json({
                    success: true,
                    message: 'User registered and profile created successfully!',
                    clerkUserId: clerkUser.id,
                    mongoProfileId: newUserProfile._id
                });

            } catch (error) {
                console.error('Error during user registration process:', error);
                let errorMessage = 'Registration failed. Please try again.';

                if (error.errors && error.errors.length > 0) {
                    errorMessage = error.errors[0].longMessage || error.errors[0].message || errorMessage;
                } else if (error.code === 11000) {
                    if (error.message.includes('email')) {
                        errorMessage = 'An account with this email already exists.';
                    } else if (error.message.includes('username')) {
                        errorMessage = 'An account with this username already exists.';
                    } else if (error.message.includes('clerkUserId')) {
                        errorMessage = 'A profile already exists for this user.';
                    } else {
                        errorMessage = 'A duplicate entry exists for one of the fields.';
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }

                res.status(400).json({ success: false, message: errorMessage });
            }
        });

        // --- API Endpoint to Fetch User Profile (After Login) ---
        // Use the middleware from the initialized clerk instance
        app.get('/api/profile', clerk.expressRequireAuth(), async (req, res) => {
            const clerkUserId = req.auth.userId;

            if (!clerkUserId) {
                return res.status(401).json({ success: false, message: 'Authentication required. No Clerk User ID found in session.' });
            }

            try {
                const userProfile = await UserProfile.findOne({ clerkUserId: clerkUserId });

                if (!userProfile) {
                    return res.status(404).json({ success: false, message: 'User profile not found in database for this authenticated user.' });
                }

                res.json({ success: true, profile: userProfile });

            } catch (error) {
                console.error('Error fetching user profile from MongoDB:', error);
                res.status(500).json({ success: false, message: 'Failed to fetch user profile data.' });
            }
        });

        // --- Start the Express Server ---
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`Landing page: http://localhost:${port}/`);
            console.log(`Registration page: http://localhost:${port}/register.html`);
            console.log(`Login page: http://localhost:${port}/login.html`);
            console.log(`(Remember to access images via /static/your-image.png)`);
            console.log(`(Make sure your MongoDB is running and Clerk keys are correct in .env!)`);
        });
    } catch (error) {
        console.error("Server startup error:", error.message);
        process.exit(1);
    }
})();