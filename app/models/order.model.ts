import mongoose from 'mongoose';

const polygonSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Polygon'],
        required: true,
    },
    coordinates: {
        type: [[[Number]]],
        required: true,
    },
});

export const OrderModel = mongoose.model(
    'Order',
    new mongoose.Schema(
        {
            carrierId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'User',
            },
            recieverId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'User',
            },
            creatorId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'User',
            },
            statusId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'OrderStatus',
                required: true,
            },
            paymentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Payment',
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
            fromLocationPolygon: {
                type: polygonSchema,
                required: false,
            },
            toLocation: {
                type: String,
                required: true,
            },
            toLocationPolygon: {
                type: polygonSchema,
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
            completionCode: {
                type: String,
                required: false,
            },
            payoutInfo: {
                isPayedOut: {
                    type: Boolean,
                    default: false,
                },
                phoneNumber: {
                    type: String,
                    required: false,
                },
                bank: {
                    type: String,
                    required: false,
                },
            },
            purchaseItemFiles: {
                type: Array,
                required: false,
            },
            beforePurchaseItemFiles: {
                type: Array,
                required: false,
                default: [],
            },
            onCompleteItemFiles: {
                type: Array,
                required: false,
                default: [],
            },
        },
        {
            timestamps: true,
        }
    )
);
