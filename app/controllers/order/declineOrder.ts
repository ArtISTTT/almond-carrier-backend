import { Request, Response } from 'express';
import { notificationText } from '../../frontendTexts/notifications';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;

/*
    Отказ от заказа для того кто присоединился или для создателя
*/
export const declineOrder = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (order == null) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const isCarrierCreator = order.carrierId?.equals(order.creatorId);

    const status = await OrderStatus.findOne({
        name: isCarrierCreator ? 'waitingReviever' : 'waitingCarrier',
    });

    if (status == null) {
        return res.status(404).send({ message: 'Status not found' });
    }

    if (isCarrierCreator) {
        await order.updateOne(
            {
                $set: {
                    statusId: status._id,
                },
                $unset: {
                    recieverId: 1,
                },
            },
            { new: true, lean: true }
        );
    } else {
        await order.updateOne(
            {
                $set: {
                    statusId: status._id,
                },
                $unset: {
                    carrierId: 1,
                },
            },
            { new: true, lean: true }
        );
    }

    order.save();

    await addNewNotification({
        text: notificationText.searchingForANewPartner,
        orderId: req.body.orderId,
        userForId: order.creatorId.toString(),
        notificationType: NotificationType.orderUpdate,
    });

    global.io.sockets.in(req.body.orderId).emit('new-status');

    return res.status(200).send({ ok: true });
};
