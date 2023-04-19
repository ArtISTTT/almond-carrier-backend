import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import db from '../../models';

const Payment = db.payment;
const OrderStatus = db.orderStatus;
const Order = db.order;

export const paymentWebHook = async (req: Request, res: Response) => {
    const data = req.body;
    console.log(req.body, '--', data.order_state[0]);

    if (data) {
        return res.status(200).send();
    }

    if (data.order_state[0] === 'AUTHORIZED' && data.state[0] === 'APPROVED') {
        await Payment.findOneAndUpdate(
            {
                paymentOrderId: data.order_id[0],
            },
            {
                $set: {
                    isPayed: true,
                    paymentDate: new Date(data.date[0]),
                },
            },
            { new: true, lean: true }
        );

        const status = await OrderStatus.findOne({
            name: 'awaitingBeforePurchaseItemsFiles',
        });

        if (!status) {
            return res.status(200).send();
        }

        await Order.findByIdAndUpdate(
            { _id: data.reference[0] },
            {
                $set: {
                    statusId: status._id,
                },
            },
            { new: true, lean: true }
        );
    }

    return res.status(200).send();
};
