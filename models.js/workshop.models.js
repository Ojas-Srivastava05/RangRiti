import mongoose from 'mongoose';

const workshopSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true
    },
    artistName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    location: {
        type: String,
        default: 'Online'
    },
    maxParticipants: {
        type: Number,
        min: 1
    },
    price: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Workshop = mongoose.model('Workshop', workshopSchema);

export default Workshop;