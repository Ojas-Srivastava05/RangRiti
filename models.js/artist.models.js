import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    artistName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: String },
    city: { type: String },
    portfolioUrl: { type: String },
    bio: { type: String },
    contactNumber: { type: String },
    instagram: { type: String },
    facebook: { type: String },
    twitter: { type: String },
    profilePictureUrl: { type: String },
    artSampleUrls: { type: [String] }
}, { timestamps: true });

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;