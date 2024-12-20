import { BaseRecord } from 'adminjs';
import { notificationText } from '../frontendTexts/notifications';
import db from '../models';
import {
    addNewNotification,
    NotificationType,
} from './notification.controller';

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

export const isConfirmPaymentByAdminAccessible = async (record: BaseRecord) => {
    const status = await OrderStatus.findById(record.params.statusId);

    return status != null && status.name === 'waitingForPaymentVerification';
};

export const confirmPaymentByAdmin = async (record: BaseRecord) => {
    const status = await OrderStatus.findOne({
        name: 'awaitingBeforePurchaseItemsFiles',
    });

    if (status == null) {
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

    if (status == null) {
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

export const confirmVerificationByAdmin = async (record: BaseRecord) => {
    await record.update({
        idVerification: {
            isVerificated: true,
        },
    });

    await record.save();
};
