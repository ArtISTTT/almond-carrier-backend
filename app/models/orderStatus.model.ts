import mongoose from 'mongoose';

export const OrderStatusModel = mongoose.model(
    'OrderStatus',
    new mongoose.Schema({
        name: String,
    })
);
