import mongoose from 'mongoose';

export const OrderModel = mongoose.model(
    'Order',
    new mongoose.Schema({
        carrierId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'user',
        },
        recieverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'user',
        },
        statusId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'orderStatus',
            require: true,
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'payment',
            require: true,
        },
        fromLocation: {
            type: String,
            require: true,
        },
        toLocation: {
            type: String,
            require: true,
        },
        completedDate: {
            type: Date,
            require: false,
        },
        productDescription: {
            type: String,
            require: false,
        },
    })
);
