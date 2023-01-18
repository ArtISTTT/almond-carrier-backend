import mongoose from 'mongoose';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models';

const User = db.user;
const Role = db.role;
const Token = db.token;
const Message = db.chatMessage;

export const getConversationByOrderId = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        const messages = await Message.aggregate([
            {
                $match: {
                    $eq: {
                        orderId: new mongoose.Types.ObjectId(orderId),
                    },
                },
            },
            { $sort: { createdAt: 1 } },
        ]);

        console.log(messages);

        return res.status(200).json({ ok: true, messages: [] });
    } catch (error) {
        return res.status(500).json({ ok: false, error: error });
    }
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

        // global.io.sockets.in(orderId).emit('new-message', { message });
        return res.status(200).json({ ok: true, message });
    } catch (error) {
        return res.status(500).json({ ok: false, error: error });
    }
};
