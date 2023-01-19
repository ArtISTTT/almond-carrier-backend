import mongoose from 'mongoose';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models';

const User = db.user;
const Role = db.role;
const Token = db.token;
const Message = db.chatMessage;

export const getConversationByOrderId = async (req: Request, res: Response) => {
    const { orderId } = req.query;

    const messages = await Message.aggregate([
        {
            $match: {
                orderId: {
                    $eq: new mongoose.Types.ObjectId(orderId as string),
                },
            },
        },
        { $sort: { createdAt: 1 } },
    ]);

    console.log(messages);

    return res.status(200).json({ ok: true, messages });
};

export const postMessage = async (req: Request, res: Response) => {
    try {
        const { userId, messageText, orderId } = req.body;

        const message = await Message.create({
            orderId,
            messageText: messageText,
            postedUserId: userId,
            readByRecipients: false,
        });

        await message.save();

        global.io.sockets.in(orderId).emit('new-message', { message });
        return res.status(200).json({ ok: true, message });
    } catch (error) {
        return res.status(500).json({ ok: false, error: error });
    }
};
