import mongoose from "mongoose";
import express from "express";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import cors from 'cors'; // Add at the top if not present
import fetch from 'node-fetch'; // Add at the top if not present
// CORRECTED MODEL PATHS
import User from '../models.js/user.models.js';
import Artist from '../models.js/artist.models.js';
import Workshop from '../models.js/workshop.models.js'; // Import the new Workshop model

import session from 'express-session';
import multer from 'multer';
import cloudinaryModule from 'cloudinary';
import Product from '../models.js/product.models.js'// ✅ your Product schema
import Order from '../models.js/order.models.js';
import nodemailer from 'nodemailer'
const cloudinary = cloudinaryModule.v2;

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary config
const app = express();



// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const port = process.env.PORT || 3000;


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '..', 'views'));  // by sunil

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Place this after express.json() and express.urlencoded()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
        }).end(buffer);
    });
}


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

// This middleware makes the `user` object available in all EJS templates.
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(async (req, res, next) => {
    if (req.session.user && req.session.user.id) {
        try {
            const user =
                req.session.user.type === 'artist'
                    ? await Artist.findById(req.session.user.id)
                    : await User.findById(req.session.user.id);

            if (user) {
                req.user = user; // ✅ Now req.user is available for /cart/add
            }
        } catch (err) {
            console.error('Error fetching user from session:', err);
        }
    }
    next();
});
// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,         // your email (e.g., rangitisvnit@gmail.com)
    pass: process.env.EMAIL_PASS          // your app password (not normal email password)
  }
});

app.post('/contact/feedback', async (req, res) => {
  const { feedbackText, rating, consent } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'rangitisvnit@gmail.com',
    subject: 'New Feedback Received - Rangriti',
    text: `
New Feedback Received on Rangriti:

Feedback:
${feedbackText}

Rating: ${rating || 'No rating provided'}

Consent to feature publicly: ${consent ? 'Yes' : 'No'}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.redirect('/thank-you'); // redirect or render a success page
  } catch (error) {
    console.error('Error sending feedback email:', error);
    res.status(500).send('Error submitting feedback. Please try again later.');
  }
});
app.post('/contact/artist', async (req, res) => {
  const { artistId, userEmail, message } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'rangitisvnit@gmail.com',
    subject: 'New Artist Connection Request - Rangriti',
    text: `
A user wants to connect with an artist:

Artist ID: ${artistId}
User Email: ${userEmail}

Message:
${message}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.redirect('/thank-you');
  } catch (error) {
    console.error('Error sending artist connection email:', error);
    res.status(500).send('Could not send your message. Please try again.');
  }
});
app.post('/contact/general', async (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'rangitisvnit@gmail.com',
    subject: `New General Inquiry: ${subject}`,
    text: `
New Contact Inquiry:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.redirect('/thank-you');
  } catch (error) {
    console.error('Error sending general inquiry:', error);
    res.status(500).send('Unable to send your message. Try again later.');
  }
});
app.post('/contact/collaboration', async (req, res) => {
  const { name, email, collaborationType, message } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'rangitisvnit@gmail.com',
    subject: 'New Collaboration Request - Rangriti',
    text: `
Collaboration Request:

Name: ${name}
Email: ${email}
Type of Collaboration: ${collaborationType}

Message:
${message}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.redirect('/thank-you');
  } catch (error) {
    console.error('Error sending collaboration email:', error);
    res.status(500).send('Unable to submit collaboration request. Please try again.');
  }
});

// by sunil
app.get('/artist/edit-profile', async (req, res) => {
  const user = req.session.user;
  if (!user || user.type !== 'artist') {
    return res.status(403).send("Unauthorized");
  }
  try {
    const artist = await Artist.findById(user.id);
    if (!artist) return res.status(404).send("Artist not found");

    res.render('artist_edit', { artist });
  } catch (err) {
    console.error("Error loading edit profile:", err);
    res.status(500).send("Server error");
  }
});
app.post('/artist/edit-profile', async (req, res) => {
  const user = req.session.user;
  if (!user || user.type !== 'artist') {
    return res.status(403).send("Unauthorized");
  }

  try {
    const updatedData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      artistName: req.body.artistName,
      city: req.body.city,
      specialization: req.body.specialization,
      bio: req.body.bio,
      portfolioUrl: req.body.portfolioUrl,
      contactNumber: req.body.contactNumber,
      instagram: req.body.instagram,
      facebook: req.body.facebook,
      twitter: req.body.twitter,
      profilePictureUrl: req.body.profilePictureUrl
    };

    await Artist.findByIdAndUpdate(user.id, updatedData);
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send("Error updating profile");
  }
});


// till this

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).render('error', { message: 'Logout failed.' });
        }
        res.redirect('index.html');
    });
});

app.get('/thank-you',(req,res)=>{
  res.render('thank-you');
})


app.get('/cart', async (req, res) => {
  try {
    const userSession = req.session.user;

    if (!userSession || !userSession.id) {
      // Flash message could be handled better with middleware
      return res.redirect('/login.html?alert=loginRequired');
    }

    const fullUser = await User.findById(userSession.id).populate('cart.productId');
    if (!fullUser) {
      return res.status(404).render('error', { message: "User not found" });
    }

    const cartItems = fullUser.cart.map(item => ({
      productId: item.productId?._id?.toString() || "",
      name: item.productId?.name || "Unknown",
      artistName: item.productId?.artistName || "Unknown",
      price: item.priceAtAddTime,
      image: item.productId?.images?.[0] || "/images/default.jpg",
      quantity: item.quantity
    }));

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 10000 ? 0 : 0;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shipping + tax;

    res.render('cart', {
      cartItems,
      subtotal,
      shipping,
      tax,
      total
    });

  } catch (err) {
    console.error("Error loading cart:", err);
    res.status(500).render('error', { message: "Failed to load cart." });
  }
});



app.post('/cart/add', async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession || !userSession.id) {
      return res.status(401).json({ message: 'You must be logged in to add to cart.' });
    }

    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(userSession.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingItem = user.cart.find(item =>
      item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cart.push({
        productId: product._id,
        quantity: 1,
        priceAtAddTime: product.price
      });
    }

    await user.save();
    return res.status(200).json({ message: 'Item added to cart' });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/cart/update', async (req, res) => {
  const { productId, quantity } = req.body;

  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ success: false, message: 'User not logged in' });
  }

  const userId = req.session.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const itemIndex = user.cart.findIndex(
      item => String(item.productId) === String(productId)
    );

    if (itemIndex === -1) {
      return res.json({ success: false, message: 'Item not in cart' });
    }

    if (quantity <= 0) {
      user.cart.splice(itemIndex, 1);
    } else {
      user.cart[itemIndex].quantity = quantity;
    }

    await user.save();

    const subtotal = user.cart.reduce((sum, item) => sum + item.quantity * item.priceAtAddTime, 0);
    const shipping = subtotal > 0 ? 50 : 0;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const updatedItem = user.cart[itemIndex]
      ? {
          total: user.cart[itemIndex].quantity * user.cart[itemIndex].priceAtAddTime,
          rewards: Math.round(user.cart[itemIndex].quantity * user.cart[itemIndex].priceAtAddTime * 0.1)
        }
      : null;

    return res.json({
      success: true,
      updatedItem,
      subtotal,
      shipping,
      tax,
      total,
      totalItems: user.cart.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (err) {
    console.error('Cart update error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.get('/product2/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).render('error', { message: 'Product not found.' });
    }


    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    res.render('details_2', { product, relatedProducts });

  } catch (err) {
    console.error('Error loading product page:', err);
    res.status(500).render('error', { message: 'Failed to load product.' });
  }
});
// Static first
app.get('/orders', async (req, res) => {
  try {
    const artistName = req.user.artistName; // assuming `req.user` is an artist

    const orders = await Order.find({ artistName }) // ✅ match string field
      .populate('product buyer')
      .sort({ createdAt: -1 });

    res.render('orders', { orders });
  } catch (err) {
    console.error("Error loading artist orders:", err);
    res.status(500).render('error', { message: "Failed to load orders." });
  }
});
app.get('/connect', async (req, res) => {
  try {
    const artists = await Artist.find({}, 'firstName lastName specialization');
    res.render('connect', { artists }); // ensure 'connect.ejs' is in your views folder
  } catch (err) {
    console.error('Error fetching artists:', err);
    res.status(500).send('Server Error');
  }
});
app.get('/artist/gallery', async (req, res) => {
  try {
    const artistId = req.session?.user?.id; // ✅ artistId is pulled correctly
    if (!artistId) {
      return res.redirect('/');
    }

    const artist = await Artist.findById(artistId); // ✅ use artistId here
    if (!artist) {
      return res.status(404).send("Artist not found");
    }

    const products = await Product.find({ artistName: artist.artistName });

    res.render('artist_gallery', {
      artist,
      products
    });
  } catch (error) {
    console.error("Error loading gallery:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Then dynamic

app.get('/artists',async (req,res)=>{
   const searchQuery = req.query.search || '';
    try {
        const artists = await Artist.find({
            $or: [
                { firstName: { $regex: searchQuery, $options: 'i' } },
                { lastName: { $regex: searchQuery, $options: 'i' } },
                { artistName: { $regex: searchQuery, $options: 'i' } }
            ]
        });

        res.render('artists', { artists, searchQuery });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching artists");
    }
})




// --- ARTIST & WORKSHOP ROUTES (CORRECT ORDER) ---

// --- STEP 1: Define ALL specific routes first ---

// Page to view all artists
app.get('/artists', async (req, res) => {
    const searchQuery = req.query.search || '';
    try {
        const artists = await Artist.find({
            $or: [
                { firstName: { $regex: searchQuery, $options: 'i' } },
                { lastName: { $regex: searchQuery, $options: 'i' } },
                { artistName: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        res.render('artists', { artists, searchQuery });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching artists");
    }
});

// Logged-in artist's product gallery
app.get('/artist/gallery', async (req, res) => {
    try {
        const artistId = req.session?.user?.id;
        if (!artistId) return res.redirect('/');
        const artist = await Artist.findById(artistId);
        if (!artist) return res.status(404).send("Artist not found");
        const products = await Product.find({ artistName: artist.artistName });
        res.render('artist_gallery', { artist, products });
    } catch (error) {
        console.error("Error loading gallery:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Logged-in artist's workshop dashboard
app.get('/artist/workshops', async (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'artist') {
        return res.status(403).redirect('/login.html');
    }
    try {
        const workshops = await Workshop.find({ artist: user.id }).sort({ date: 'asc' });
        res.render('artist_workshops', { workshops });
    } catch (error) {
        console.error("Error fetching artist workshops:", error);
        res.status(500).render('error', { message: "Server error" });
    }
});


// --- STEP 2: Define ALL dynamic routes (with /:id) last ---

// Page for an artist to edit one of their products
app.get('/artist/edit-product/:id', async (req, res) => {
    try {
        const artistId = req.session?.user?.id;
        if (!artistId) return res.redirect('/');
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("Product not found");
        const artist = await Artist.findById(artistId);
        if (product.artistName !== artist.artistName) {
            return res.status(403).send("Not authorized to edit this product");
        }
        res.render('edit_product', { product });
    } catch (error) {
        console.error("Error loading edit page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// API endpoint to delete a product
app.post('/artist/delete-product/:id', async (req, res) => {
    try {
        const artistId = req.session?.user?.id;
        if (!artistId) return res.redirect('/');
        const productId = req.params.id;
        const artist = await Artist.findById(artistId);
        const product = await Product.findById(productId);
        if (!product || product.artistName !== artist.artistName) {
            return res.status(403).send("Not authorized to delete this product");
        }
        await Product.findByIdAndDelete(productId);
        res.redirect('/artist/gallery');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Public profile page for any artist (This is the most general route and must be last)
// NOTE: I have combined your two '/artist/:id' and '/artists/:id' routes into one.
app.get('/artists/:id', async (req, res) => {
    const artistId = req.params.id;
    try {
        const artist = await Artist.findById(artistId).populate('products');
        if (!artist) {
            return res.status(404).send("Artist not found");
        }
        res.render('artist-profile', { artist, products: artist.products });
    } catch (err) {
        console.error("Error loading artist profile:", err);
        res.status(500).send("Server error");
    }
});

app.post('/api/edit-product/:id', upload.array('images'), async (req, res) => {
  const productId = req.params.id;

  try {
    const updatedData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      quantityAvailable: req.body.quantityAvailable,
      material: req.body.material,
      size: req.body.size,
      originRegion: req.body.originRegion,
      tags: req.body.tags,
      artistName: req.body.artistName,
    };

    if (req.files && req.files.length > 0) {
      updatedData.images = req.files.map(file => file.path); // or your cloudinary url logic
    }

    await Product.findByIdAndUpdate(productId, updatedData);
    res.redirect('/artist/gallery');
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Failed to update product");
  }
});


app.post('/buy-now/:productId', async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession || !userSession.id) {
      return res.redirect('/login');
    }

    const { productId } = req.params;
    const user = await User.findById(userSession.id);
    if (!user) return res.status(404).send('User not found');

    const product = await Product.findById(productId);
    if (!product) return res.status(404).send('Product not found');

    const newOrder = new Order({
      product: product._id,
      artistName: product.artistName, // 👈 grab from product
      buyer: user._id,
      priceAtPurchase: product.price
    });

    await newOrder.save();

    // Clear cart or handle post-order logic
    user.cart = [];
    await user.save();

    res.send(`
      <script>
        alert('Order request sent!');
        window.location.href = '/marketplace';
      </script>
    `);
  } catch (err) {
    console.error('Error in buy-now:', err);
    res.status(500).send('Internal Server Error');
  }
});



// --- WORKSHOP & CALENDAR ROUTES ---

// Page to render the "Create Workshop" form for an artist
app.get('/workshops/new', async (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'artist') {
        return res.status(403).redirect('/login.html');
    }
    try {
        const artist = await Artist.findById(user.id);
        res.render('create_workshop', { artist });
    } catch (error) {
        console.error("Error loading create workshop page:", error);
        res.status(500).render('error', { message: "Server error" });
    }
});

// API endpoint for an artist to create a new workshop
app.post('/api/workshops/create', async (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'artist') {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const artist = await Artist.findById(user.id);
        if (!artist) {
            return res.status(404).json({ message: "Artist not found" });
        }

        const newWorkshop = new Workshop({
            ...req.body,
            artist: artist._id,
            artistName: artist.artistName
        });

        const savedWorkshop = await newWorkshop.save();

        // Add workshop to the artist's list of workshops
        artist.workshops.push(savedWorkshop._id);
        await artist.save();

        res.status(201).redirect('/artist/workshops');

    } catch (error) {
        console.error("Error creating workshop:", error);
        res.status(500).json({ message: "Failed to create workshop." });
    }
});

// Page for an artist to view their own scheduled workshops
app.get('/artist/workshops', async (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'artist') {
        return res.status(403).redirect('/login.html');
    }
    try {
        const workshops = await Workshop.find({ artist: user.id }).sort({ date: 'asc' });
        res.render('artist_workshops', { workshops });
    } catch (error) {
        console.error("Error fetching artist workshops:", error);
        res.status(500).render('error', { message: "Server error" });
    }
});

// Public calendar page
app.get('/calendar', (req, res) => {
    res.render('calendar');
});

// API endpoint to fetch all workshops for the public calendar
app.get('/api/workshops', async (req, res) => {
    try {
        const workshops = await Workshop.find({})
            .populate('artist', 'artistName profilePictureUrl')
            .lean();

        // Format data for FullCalendar.js
        const events = workshops.map(ws => ({
            title: ws.title,
            start: ws.date,
            extendedProps: {
                artistName: ws.artistName,
                description: ws.description,
                startTime: ws.startTime,
                endTime: ws.endTime,
                location: ws.location,
                price: ws.price,
                category: ws.category
            }
        }));
        res.json(events);
    } catch (error) {
        console.error("Error fetching workshops for calendar:", error);
        res.status(500).json({ message: "Failed to fetch workshops." });
    }
});


// --- ROOT ROUTE ---
// This route will now be executed for the root URL.
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'landing.html'));
}); //route to index

app.get('/dashboard', async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        if (!userId) {
            return res.redirect('/');
        }

        const artist = await Artist.findById(userId);
        if (!artist) {
            return res.status(404).send("Artist not found");
        }

        res.render('dashboard_artist', { artist });  // ✅ make sure you're passing artist here
    } catch (err) {
        console.error("Dashboard render error:", err);
        res.status(500).send("Server error");
    }
});
app.get('/user', async (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'user') {
        return res.status(403).render('error', { message: 'Unauthorized access.' });
    }

    try {
        // Fetch only a few featured products (you can change the filter logic later)
        const products = await Product.find().sort({ dateCreated: -1 }).limit(6).lean();
        res.render('marketplace', { user, products });
    } catch (err) {
        console.error("Error loading user marketplace:", err);
        res.status(500).render('error', { message: "Failed to load marketplace." });
    }
});

app.get('/marketplace', async (req, res) => {
  try {
    const products = await Product.find().sort({ dateCreated: -1 }).limit(6).lean();
    const user = req.session?.user || null;
    res.render('marketplace', { user, products });
  } catch (err) {
    console.error("Marketplace error:", err);
    res.status(500).render('error', { message: "Failed to load marketplace." });
  }
});

app.get('/catalogue', async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            minRating,
            artist,
            availability
        } = req.query;

        const filter = {};

        if (category) {
            filter.category = { $in: category.split(',') };
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (minRating) {
            filter.rating = { $gte: Number(minRating) };
        }

        if (artist) {
            filter.artistName = { $in: artist.split(',') };
        }

        if (availability === 'inStock') {
            filter.inStock = true;
        } else if (availability === 'preorder') {
            filter.inStock = false;
        }

        const products = await Product.find(filter).lean();

        // ✅ Define user from req.user or fallback to null
        const user = req.user || null;

        res.render('catalogue', { products, user }); // ✅ Now safe
    } catch (error) {
        console.error("Error loading filtered catalogue:", error);
        res.status(500).send("Failed to load filtered products.");
    }
});
app.get('/product', async (req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) {
        return res.redirect('/');
    }

    try {
        const artist = await Artist.findById(userId);
        if (!artist) {
            return res.status(404).send("Artist not found");
        }

        res.render('product', { artist });  // if you want to show artist info in form, etc.
    } catch (err) {
        console.error("Error loading product form:", err);
        res.status(500).send("Server error");
    }
});
app.post('/api/add-product', upload.array('images'), async (req, res) => {
    try {
        const artistId = req.session?.user?.id;
        if (!artistId) {
            return res.redirect('/');
        }

        const {
            name,
            category,
            description,
            price,
            quantityAvailable,
            material,
            size,
            originRegion,
            tags
        } = req.body;

        // Upload images to Cloudinary
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
            imageUrls = await Promise.all(uploadPromises);
        } else {
            imageUrls = ['https://via.placeholder.com/300'];
        }

        // Get artist object (to fetch artistName for product and push product ID)
        const artist = await Artist.findById(artistId);
        if (!artist) {
            return res.status(404).send("Artist not found");
        }

        // Create new product
        const newProduct = new Product({
            name,
            artistName: artist.artistName,  // store display name
            category,
            description,
            images: imageUrls,
            price,
            quantityAvailable: quantityAvailable || 1,
            material,
            size,
            originRegion,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        const savedProduct = await newProduct.save();

        // Push product ID into artist's products array
        artist.products.push(savedProduct._id);
        await artist.save();

        res.redirect('/dashboard?success=true');

    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).json({ success: false, message: "Failed to add product." });
    }
});


app.get('/product/:productId', async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId).lean();

    if (!product) {
      return res.status(404).render('error', { message: "Product not found." });
    }

    // 🧠 Related Products: Same category, exclude current product
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4).lean();

    res.render('details', {
      product,
      relatedProducts,
      user: req.session.user || null
    });

  } catch (error) {
    console.error("Error loading product details:", error);
    res.status(500).render('error', { message: "Failed to load product details." });
  }
});
// --- Registration Endpoints ---

// Endpoint for registering a standard user
app.post('/api/register/user', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Check both User and Artist collections for the email
        const existingUser = await User.findOne({ email });
        const existingArtist = await Artist.findOne({ email });
        if (existingUser || existingArtist) {
            return res.status(409).json({ message: 'An account with this email already exists. Please use a different email or log in.' });
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

        // Check both Artist and User collections for the email
        const existingArtist = await Artist.findOne({ email });
        const existingUser = await User.findOne({ email });
        if (existingArtist || existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists. Please use a different email or log in.' });
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
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        req.session.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            type: userType
        };

        if (userType === 'artist') {
            return res.status(200).json({ message: 'Login successful', redirect: '/dashboard' });
        } else {
            return res.status(200).json({ message: 'Login successful', redirect: 'marketplace' });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Move TTS route to here - BEFORE the error handlers
app.post("/api/tts", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    const apiKey = process.env.VOICE_RSS_API_KEY;

    const url = `https://api.voicerss.org/?key=${apiKey}&hl=en-us&v=Mary&r=0&src=${encodeURIComponent(
        text
    )}&c=MP3&f=44khz_16bit_stereo`;

    try {
        const response = await fetch(url);
        const audioBuffer = await response.arrayBuffer();

        res.set({
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.byteLength,
        });

        res.send(Buffer.from(audioBuffer));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "TTS request failed" });
    }
});

// 404 - Page Not Found (Keep this AFTER all your routes)
app.use((req, res, next) => {
  res.status(404).render('error', {
    message: 'Page Not Found',
    errorCode: 404
  });
});

// Global Error Handler (Keep this AFTER 404)
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err.stack || err);

  res.status(500).render('error', {
    message: 'Something went wrong. Please try again later.',
    errorCode: 500
  });
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

console.log("Voice RSS API Key:", process.env.VOICE_RSS_API_KEY ? "✓ Loaded" : "✗ Missing");