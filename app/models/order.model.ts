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
            required: true,
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'payment',
            required: true,
        },
        arrivalDate: {
            type: Date,
            required: false,
        },
        orderDate: {
            type: Date,
            required: false,
        },
        carrierMaxWeight: {
            type: Number,
            required: false,
        },
        fromLocation: {
            type: String,
            required: false,
        },
        toLocation: {
            type: String,
            required: true,
        },
        completedDate: {
            type: Date,
            required: false,
        },
        productName: {
            type: String,
            required: false,
        },
        productDescription: {
            type: String,
            required: false,
        },
        productWeight: {
            type: Number,
            required: false,
        },
    })
);
