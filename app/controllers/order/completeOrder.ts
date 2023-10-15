import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getPureSummary } from '../../helpers/getOrderPaymentSum';
import db from '../../models';
import { createOrderForPayout } from '../../payment/createOrder';

const Order = db.order;
const Payment = db.payment;
const OrderStatus = db.orderStatus;

export const completeOrder = async (req: Request, res: Response) => {
    const status = await OrderStatus.findOne({
        name: 'itemRecieved',
    });

    if (status == null) {
        return res.status(404).send({ message: 'Status not found' });
    }

    const order = await Order.findOneAndUpdate(
        {
            $and: [
                {
                    _id: {
                        $eq: new mongoose.Types.ObjectId(
                            req.body.orderId as string
                        ),
                    },
                },
                { completionCode: req.body.completionCode },
            ],
        },
        {
            $set: {
                statusId: status._id,
                completedDate: new Date(),
            },
        },
        { new: true, lean: true }
    );

    if (order == null) {
        return res.status(404).send({ message: 'incorrectCompletionCode' });
    }

    const payment = await Payment.findById(order.paymentId);

    if (
        payment == null ||
        !payment.productAmount ||
        !payment.rewardAmount ||
        !order.productName
    ) {
        return res.status(404).send({ message: 'payoutError' });
    }

    // const payoutOrderId = await createOrderForPayout({
    //     amount: getPureSummary({
    //         productAmount: payment.productAmount,
    //         rewardAmount: payment.rewardAmount,
    //     }),
    //     orderId: req.body.orderId,
    //     productName: order.productName,
    // });

    // if (!payoutOrderId) {
    //     return res.status(404).send({ message: 'payoutError' });
    // }

    // payment.payoutOrderId = payoutOrderId;

    await payment.save();

    global.io.sockets.in(req.body.orderId).emit('new-status');

    return res.status(200).send({ ok: true });
};
