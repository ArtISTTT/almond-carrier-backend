import mongoose, { Document, Types } from 'mongoose';

const polygonSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Polygon'],
        required: false,
    },
    coordinates: {
        type: [[[Number]]],
        required: false,
    },
});

interface PayoutInfo {
    isPayedOut: boolean;
    phoneNumber?: string;
    bank?: string;
}

interface PolygonSchema {
    type: string;
    coordinates: number[][][];
}

export interface IOrder extends Document {
    carrierId?: Types.ObjectId;
    recieverId?: Types.ObjectId;
    creatorId: Types.ObjectId;
    statusId: Types.ObjectId;
    paymentId: Types.ObjectId;
    arrivalDate?: Date;
    orderDate?: Date;
    carrierMaxWeight?: number;
    fromLocation?: string;
    fromLocationPolygon?: PolygonSchema;
    toLocation: string;
    toLocationPolygon: PolygonSchema;
    fromLocation_placeId?: string;
    toLocation_placeId: string;
    completedDate?: Date;
    productName?: string;
    productUri?: string;
    productDescription?: string;
    productWeight?: number;
    byCarrierSuggestedChanges?: Record<string, any>;
    byReceiverSuggestedChanges?: Record<string, any>;
    dealConfirmedByCarrier?: boolean;
    dealConfirmedByReceiver?: boolean;
    completionCode?: string;
    payoutInfo?: PayoutInfo;
    purchaseItemFiles?: any[];
    beforePurchaseItemFiles?: any[];
    onCompleteItemFiles?: any[];
    createdAt?: Date; // Added due to `timestamps: true`
    updatedAt?: Date; // Added due to `timestamps: true`
}

const OrderSchema = new mongoose.Schema<IOrder>(
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
);

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
