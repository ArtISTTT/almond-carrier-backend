import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const TokenModel = mongoose.model(
    'Token',
    new Schema({
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'user',
        },
        token: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 3600, // this is the expiry time in seconds
        },
    })
);
