import mongoose from 'mongoose';

export const ChatMessageModel = mongoose.model(
    'ChatMessage',
    new mongoose.Schema(
        {
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'order',
            },
            postedUserId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'user',
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
