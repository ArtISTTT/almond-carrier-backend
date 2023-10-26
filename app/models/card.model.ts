import mongoose, { Document, Types } from 'mongoose';

export interface ICard extends Document {
    userId: Types.ObjectId;
    number: string;
    name: string;
    bankName: string;
    token: string;
}

export const CardModel = mongoose.model<ICard>(
    'Card',
    new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        number: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        bankName: {
            type: String,
            required: true,
        },
        token: {
            type: String,
            required: true,
        },
    })
);
