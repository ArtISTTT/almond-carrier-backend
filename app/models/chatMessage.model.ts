import mongoose from 'mongoose';

export const ChatMessageModel = mongoose.model(
    'ChatMessage',
    new mongoose.Schema(
        {
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'Order',
            },
            postedUserId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'User',
            },
            messageText: {
                type: String,
                required: true,
            },
            readByRecipients: Boolean,
        },
        {
            timestamps: true,
        }
    )
);
