import { Request, Response } from 'express';
import db from '../../models';
import { createOrderForPayout } from '../../payment/createOrder';
import logger from '../../services/logger';

const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Card = db.card;
const User = db.user;

export const startPayout = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'success',
    });

    const { cardId, userId, orderId } = req.body;

    if (status == null || !cardId || !userId || !orderId) {
        return res.status(404).send({ message: 'Item not found' });
    }

    const order = await Order.findById(orderId);

    if (order == null) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    if (order.payoutInfo?.isPayedOut === true) {
        return res.status(404).send({ message: 'Already payed out' });
    }

    const payment = await Payment.findById(order.paymentId);

    if (payment == null) {
        return res.status(404).send({ message: 'Payment not found!' });
    }

    const card = await Card.findById(cardId);

    if (card == null) {
        return res.status(404).send({ message: 'Card not found!' });
    }

    const isPayedOut = await createOrderForPayout({
        order,
        payment,
        card,
    });

    if (!isPayedOut) {
        logger.error('startPayout: cant pay out');
        return res.status(500).send({ message: 'Something went wrong!' });
    }

    await order.updateOne(
        {
            $set: {
                statusId: status._id,
                payoutInfo: {
                    cardId: cardId,
                    payoutDate: new Date(),
                    isPayedOut: true,
                },
            },
        },
        { new: true, lean: true }
    );

    global.io.sockets.in(req.body.orderId).emit('new-status');

    return res.status(200).send({ ok: true });
};
