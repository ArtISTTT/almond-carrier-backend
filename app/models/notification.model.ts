import mongoose from 'mongoose';

export const NotificationModel = mongoose.model(
    'Notification',
    new mongoose.Schema(
        {
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'order',
            },
            userForId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'user',
            },
            notificationType: {
                type: String,
                required: true,
            },
            text: {
                type: String,
                required: true,
            },
            read: {
                type: Boolean,
                required: true,
            },
        },
        {
            timestamps: true,
        }
    )
);
