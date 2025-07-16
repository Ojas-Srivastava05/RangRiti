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
import multer from 'multer';
import cloudinaryModule from 'cloudinary';
import Product from '../models.js/product.models.js'// ✅ your Product schema

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

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).render('error', { message: 'Logout failed.' });
        }
        res.redirect('/');
    });
});


app.get('/cart', async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/'); // or show "Please login" message
        }

        await req.user.populate('cart.productId'); // Populate full product info

const cartItems = req.user.cart.map(item => ({
    productId: item.productId._id.toString(), // ✅ Add this line
    name: item.productId.name,
    artistName: item.productId.artistName,
    price: item.priceAtAddTime,
    image: item.productId.images[0],
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
        if (!req.user) {
            return res.status(401).json({ message: 'You must be logged in to add to cart.' });
        }

        const { productId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const user = req.user;

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
app.get('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).render('error', { message: 'Product not found.' });
    }


    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    res.render('details', { product, reviews, relatedProducts });

  } catch (err) {
    console.error('Error loading product page:', err);
    res.status(500).render('error', { message: 'Failed to load product.' });
  }
});


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
app.get('/artists/:id', async (req, res) => {
    const artistId = req.params.id;

    try {
        const artist = await Artist.findById(artistId);
            const products = await Product.find({ artistName: artist.artistName }); 
        let isFollowing = false;


        res.render('artist-profile', { artist,products });
    } catch (err) {
        console.error(err);
        res.status(500).send("Artist not found");
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
app.get('/user', (req, res) => {
    const user = req.session.user;
    if (!user || user.type !== 'user') {
        return res.status(403).render('error', { message: 'Unauthorized access.' });
    }
    res.render('marketplace', { user }); // route to marketplace
});

app.get('/marketplace', (req, res) => {
    res.render('marketplace')
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
app.get('/product', (req, res) => {
    
    res.render('product');
})

app.post('/api/add-product', upload.array('images'), async (req, res) => {
    try {
        const {
            name,
            artistName,
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

        const newProduct = new Product({
            name,
            artistName,
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

        await newProduct.save();
        res.redirect('/dashboard?success=true');

    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).json({ success: false, message: "Failed to add product." });
    }
});


app.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product) return res.status(404).send("Product not found");

        const user = req.user || null;
        res.render('details', { product, user });
    } catch (error) {
        console.error("Error loading product:", error);
        res.status(500).send("Failed to load product details.");
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
            return res.status(200).json({ message: 'Login successful', redirect: '/user' });
        }
    } catch (error) {
        console.error("Login error:", error);
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