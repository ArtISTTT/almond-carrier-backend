import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TokenModel = mongoose.model(
    'Token',
    new Schema({
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        token: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 1000000, // this is the expiry time in seconds
        },
    })
);
