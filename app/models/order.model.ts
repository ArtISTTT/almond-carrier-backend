import mongoose from 'mongoose';

export const OrderModel = mongoose.model(
    'Order',
    new mongoose.Schema(
        {
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
            fromLocation_placeId: {
                type: String,
                required: false,
            },
            toLocation_placeId: {
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
            productUri: {
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
            byCarrierSuggestedChanges: {
                type: Object,
                required: false,
            },
            byReceiverSuggestedChanges: {
                type: Object,
                required: false,
            },
            dealConfirmedByCarrier: {
                type: Boolean,
                required: false,
            },
            dealConfirmedByReceiver: {
                type: Boolean,
                required: false,
            },
        },
        {
            timestamps: true,
        }
    )
);
