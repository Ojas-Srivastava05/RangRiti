import mongoose from "mongoose";
import express from "express";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
// CORRECTED MODEL PATHS
import User from '../models.js/user.models.js';
import Artist from '../models.js/artist.models.js';

import session from 'express-session';
const app = express();



// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const port = process.env.PORT || 3000;

app.set('view engine','ejs')

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORRECTED STATIC MIDDLEWARE
// The { index: false } option prevents Express from automatically serving index.html on '/'.
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false }));
app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey', // store in .env for production
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));


// --- ROOT ROUTE ---
// This route will now be executed for the root URL.
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
});

app.get('/dashboard', (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'artist') {
        return res.status(403).render('error', { message: 'Unauthorized access.' });
    }
    res.render('dashboard', { user });
});

app.get('/user', (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'user') {
        return res.status(403).render('error', { message: 'Unauthorized access.' });
    }
    res.render('marketplace', { user });
});
// --- Registration Endpoints ---

// Endpoint for registering a standard user
app.post('/api/register/user', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            ...req.body,
            password: hashedPassword
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully!', userId: newUser._id });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: 'Server error during user registration.' });
    }
});

// Endpoint for registering an artist
app.post('/api/register/artist', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const existingArtist = await Artist.findOne({ email });
        if (existingArtist) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newArtist = new Artist({
            ...req.body,
            password: hashedPassword
        });
        await newArtist.save();
        res.status(201).json({ message: 'Artist created successfully!', artistId: newArtist._id });
    } catch (error) {
        console.error("Error registering artist:", error);
        res.status(500).json({ message: 'Server error during artist registration.' });
    }
});

// --- LOGIN ENDPOINT ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        let user = await User.findOne({ email });
        let userType = 'user';

        if (!user) {
            user = await Artist.findOne({ email });
            userType = 'artist';
        }

        if (!user) {
            return res.status(404).json({ message: 'No account found with that email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials. Please check your password.' });
        }
        req.session.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            type: userType
        };

        // ✅ Redirect
        if (userType === 'artist') {
            return res.redirect('/dashboard');
        } else {
            return res.redirect('/user');
        }



        

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// --- Server Start ---
(async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not defined in your .env file.");
        }
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully!");
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`Landing page should now be served at the root URL.`);
        });
    } catch (error) {
        console.error("Server startup error:", error.message);
        process.exit(1);
    }
})();