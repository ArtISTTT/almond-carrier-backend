import mongoose from 'mongoose';

export const PaymentModel = mongoose.model(
    'Payment',
    new mongoose.Schema({
        rewardAmount: {
            type: mongoose.Types.Decimal128,
            require: true,
        },
        productAmount: {
            type: mongoose.Types.Decimal128,
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
    })
);
