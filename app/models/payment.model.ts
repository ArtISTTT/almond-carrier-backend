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
            paymentCPComission: {
                type: Number,
                required: true,
            },
            dueCPComission: {
                type: Number,
                required: true,
            },
            ourDueComission: {
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
        },
        {
            timestamps: true,
        }
    )
);
