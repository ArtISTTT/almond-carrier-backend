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
        },
        {
            timestamps: true,
        }
    )
);
