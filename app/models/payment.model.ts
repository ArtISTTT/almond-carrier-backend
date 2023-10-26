import mongoose, { Document } from 'mongoose';

export interface IPayment extends Document {
    rewardAmount: number;
    productAmount?: number;
    isPayed: boolean;
    paymentDate?: Date;
    currency: string;
    paymentOrderId?: string;
    payoutOrderId?: string;
    paymentOperationId?: string;
    isPayedOut?: boolean;
    payOutDate?: Date;
    payOutOperationId?: string;
    createdAt?: Date; // Added due to `timestamps: true`
    updatedAt?: Date; // Added due to `timestamps: true`
    paymentUrl?: string;
    paymentExpire?: Date;
    txnId?: string;
    sign?: string;
    txnStatus?: number;
}

export const PaymentModel = mongoose.model<IPayment>(
    'Payment',
    new mongoose.Schema(
        {
            rewardAmount: {
                type: Number,
                require: true,
            },
            productAmount: {
                type: Number,
                require: false,
            },
            txnId: {
                type: String,
                require: false,
            },
            sign: {
                type: String,
                require: false,
            },
            txnStatus: {
                type: Number,
                require: false,
            },
            isPayed: {
                type: Boolean,
                require: true,
                default: false,
            },
            paymentDate: {
                type: Date,
                require: false,
            },
            paymentExpire: {
                type: Date,
                require: false,
            },
            currency: {
                type: String,
                require: true,
            },
            paymentOrderId: {
                type: String,
                required: false,
            },
            payoutOrderId: {
                type: String,
                required: false,
            },
            paymentOperationId: {
                type: String,
                required: false,
            },
            isPayedOut: {
                type: Boolean,
                required: false,
                default: false,
            },
            payOutDate: {
                type: Date,
                require: false,
            },
            payOutOperationId: {
                type: String,
                required: false,
            },
            paymentUrl: {
                type: String,
                required: false,
            },
        },
        {
            timestamps: true,
        }
    )
);
