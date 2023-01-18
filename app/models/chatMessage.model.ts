import mongoose from 'mongoose';

export const ChatMessageModel = mongoose.model(
    'ChatMessage',
    new mongoose.Schema(
        {
            orderId: mongoose.Schema.Types.ObjectId,
            messageText: mongoose.Schema.Types.String,
            postedUserId: mongoose.Schema.Types.ObjectId,
            readByRecipients: Boolean,
        },
        {
            timestamps: true,
        }
    )
);
