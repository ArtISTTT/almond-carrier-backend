import mongoose from 'mongoose';
import { ReviewerType } from '../types/review';

export const ReviewModel = mongoose.model(
    'Review',
    new mongoose.Schema({
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Order',
        },
        userReviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        userForId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        reviewerType: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            require: true,
        },
        rating: {
            type: Number,
            require: true,
        },
    })
);
