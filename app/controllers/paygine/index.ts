import { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import db from '../../models';

const Payment = db.payment;
const OrderStatus = db.orderStatus;
const Order = db.order;

export const paymentWebHook = async (req: Request, res: Response) => {
    const parser = new XMLParser();

    const data = parser.parse(req.body).operation;

    console.log(data);

    if (!data) {
        return res.status(200).send();
    }

    if (
        data.order_state === 'COMPLETED' &&
        data.state === 'APPROVED' &&
        data.type === 'SDPayInDebit'
    ) {
        await Payment.findOneAndUpdate(
            {
                paymentOrderId: data.order_id,
            },
            {
                $set: {
                    isPayed: true,
                    paymentDate: new Date(data.date),
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
            { _id: data.reference },
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
