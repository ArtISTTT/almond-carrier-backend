import mongoose from 'mongoose';

export const PaymentModel = mongoose.model(
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
            sdRef: {
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
        },
        {
            timestamps: true,
        }
    )
);
