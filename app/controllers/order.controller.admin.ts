import db from '../models';
import {
    NotificationType,
    addNewNotification,
} from './notification.controller';
import { notificationText } from '../frontendTexts/notifications';
import { BaseRecord } from 'adminjs';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

export const isConfirmPaymentByAdminAccessible = async (record: BaseRecord) => {
    const status = await OrderStatus.findById(record.params.statusId);

    return status && status.name === 'waitingForPaymentVerification';
};

export const confirmPaymentByAdmin = async (record: BaseRecord) => {
    const status = await OrderStatus.findOne({
        name: 'awaitingDelivery',
    });

    if (!status) {
        return;
    }

    await record.update({
        statusId: status._id,
    });

    await record.populated.paymentId.update({
        isPayed: true,
    });

    await record.populated.paymentId.save();
    await record.save();

    global.io.sockets.in(record.params.recieverId).emit('new-status');
    global.io.sockets.in(record.params.carrierId).emit('new-status');

    await addNewNotification({
        text: notificationText.paymentSuccess,
        orderId: record.params._id,
        userForId: record.params.recieverId,
        notificationType: NotificationType.orderUpdate,
    });

    await addNewNotification({
        text: notificationText.paymentSuccess,
        orderId: record.params._id,
        userForId: record.params.carrierId,
        notificationType: NotificationType.orderUpdate,
    });
};

export const confirmPayoutByAdmin = async (record: BaseRecord) => {
    const status = await OrderStatus.findOne({
        name: 'success',
    });

    if (!status) {
        return;
    }

    await record.update({
        statusId: status._id,
    });

    await record.save();

    global.io.sockets.in(record.params.carrierId).emit('new-status');

    await addNewNotification({
        text: notificationText.payoutSuccess,
        orderId: record.params._id,
        userForId: record.params.carrierId,
        notificationType: NotificationType.orderUpdate,
    });
};
