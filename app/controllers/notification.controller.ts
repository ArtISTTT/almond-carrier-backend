import db from '../models';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

const Notification = db.notification;
const Order = db.order;

export enum NotificationType {
    orderUpdate = 'orderUpdate',
    newMessage = 'newMessage',
}

const getNotificationsOutput = (notifications: any[]) => {
    return notifications.map(notification => {
        return {
            id: notification._id,
            type: notification.notificationType,
            text: notification.text,
            read: notification.read,
            productName: notification.order.productName,
            orderId: notification.orderId,
            createdDate: notification.createdAt,
        };
    });
};

export const addNewNotification = async ({
    text,
    orderId,
    userForId,
    notificationType,
}: {
    text: string;
    orderId: string;
    userForId: string;
    notificationType: NotificationType;
}) => {
    let able = true;

    if (notificationType === NotificationType.newMessage) {
        const notification = await Notification.findOne({
            notificationType: NotificationType.newMessage,
            orderId,
            userForId,
        });

        if (notification) {
            able = false;
        }
    }

    if (able) {
        const notification = await Notification.create({
            orderId,
            userForId,
            notificationType,
            text,
            read: false,
        });

        const order = await Order.findById(orderId);

        global.io.sockets.in(userForId).emit('new-notification', {
            notification: getNotificationsOutput([
                {
                    _id: notification._id,
                    notificationType: notification.notificationType,
                    text: notification.text,
                    read: notification.read,
                    order: {
                        productName: order?.productName,
                    },
                    orderId: notification.orderId,
                    createdDate: notification.createdAt,
                },
            ])[0],
        });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    const notifications = await Notification.aggregate([
        {
            $match: {
                userForId: {
                    $eq: new mongoose.Types.ObjectId(req.body.userId),
                },
            },
        },
        {
            $lookup: {
                from: Order.collection.name,
                localField: 'orderId',
                foreignField: '_id',
                as: 'order',
            },
        },
        {
            $unwind: '$order',
        },
    ]);

    return res
        .status(200)
        .send({ notifications: getNotificationsOutput(notifications) });
};

export const removeNotification = async (req: Request, res: Response) => {
    await Notification.deleteOne({ _id: req.query.notificationId });

    return res.status(200).send();
};

export const removeAllNotifications = async (req: Request, res: Response) => {
    await Notification.deleteMany({ userForId: req.body.userId });

    return res.status(200).send();
};
