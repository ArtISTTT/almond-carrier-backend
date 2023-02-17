import mongoose from 'mongoose';
import { ReviewerType } from '../types/review';

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
        reviewerType: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            require: true,
        },
        rating: {
            type: String,
            require: true,
        },
    })
);
