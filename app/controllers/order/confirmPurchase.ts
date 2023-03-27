import { Request, Response } from 'express';
import fs from 'fs';
import { uploadFile } from '../../aws-s3/uploadFile';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;

export const confirmPurchase = async (req: Request, res: Response) => {
    const files = req.files;

    if (Array.isArray(files)) {
        const uploadedFiles = await Promise.all(
            files.map(async file => {
                const isPdf = file.filename.split('.').pop() === 'pdf';

                const locationPromise = new Promise<string>(
                    (resolve, reject) => {
                        fs.readFile(file.path, async (err, data) => {
                            const result = await uploadFile(
                                file.path,
                                file.filename,
                                req,
                                res,
                                data,
                                'order-files',
                                isPdf ? 'application/pdf' : undefined,
                                isPdf ? 'binary' : undefined,
                                isPdf ? 'inline' : undefined
                            );

                            resolve(result.Location as string);
                        });
                    }
                );

                return await locationPromise;
            })
        );

        const status = await OrderStatus.findOne({
            name: 'awaitingRecieverItemPurchasePhotosConfirmation',
        });

        if (!status) {
            return res.status(404).send({ message: 'Status not found' });
        }

        const order = await Order.findByIdAndUpdate(
            { _id: req.body.orderId },
            {
                $set: {
                    purchaseItemFiles: [uploadedFiles],
                    statusId: status._id,
                },
            },
            { new: true, lean: true }
        );

        if (!order) {
            return res.status(500).send({ ok: false });
        }

        global.io.sockets.in(req.body.orderId).emit('new-status');

        await addNewNotification({
            text: notificationText.purchaseCompleted,
            orderId: req.body.orderId,
            userForId: String(order.recieverId),
            notificationType: NotificationType.orderUpdate,
        });

        return res.status(200).send({ uploadedFiles });
    }

    return res.status(500).send({ ok: false });
};
