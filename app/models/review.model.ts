import mongoose from 'mongoose';

export const ReviewModel = mongoose.model(
    'Review',
    new mongoose.Schema({
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'order',
        },
        userReviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'user',
        },
        userForId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'user',
        },
        text: {
            type: String,
            require: true,
        },
        raiting: {
            type: String,
            require: true,
        },
    })
);
