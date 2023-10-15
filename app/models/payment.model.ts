import mongoose, { Document } from 'mongoose';

export interface IPayment extends Document {
    rewardAmount: number;
    productAmount?: number;
    paymentPaySystemComission: number;
    ourPaymentComission: number;
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
            paymentPaySystemComission: {
                type: Number,
                required: true,
            },
            ourPaymentComission: {
                type: Number,
                required: true,
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
