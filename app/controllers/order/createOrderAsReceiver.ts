import { Request, Response } from 'express';
import * as core from 'express-serve-static-core';
import { COMISSIONS } from '../../helpers/consts';
import { convertBoundsToPolygon } from '../../helpers/initialize/convertBoundsToPolygon';
import db from '../../models';
import { IBounds } from '../../types/geometry';

const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;

type IReqCreateOrderAsReceiver = Request<
    core.ParamsDictionary,
    {},
    {
        currency: string;
        userId: string;
        toLocation: string;
        toLocation_placeId: string;
        toLocationBounds: IBounds;
        fromLocation?: string;
        fromLocation_placeId?: string;
        fromLocationBounds?: IBounds;
        productName: string;
        productUri?: string;
        rewardAmount: number;
        productAmount: number;
        productWeight: number;
        productDescription: string;
    }
>;

export const createOrderAsReceiver = async (
    req: IReqCreateOrderAsReceiver,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'waitingCarrier' });

    if (status == null) {
        res.status(404).send({ message: 'Status not found' });
        return;
    }

    const payment = await Payment.create({
        rewardAmount: req.body.rewardAmount,
        productAmount: req.body.productAmount,
        currency: req.body.currency,
        paymentPaySystemComission: COMISSIONS.PAYMENT_CP_COMISSION,
        ourPaymentComission: COMISSIONS.DUE_OUR_COMISSION,
    });

    await Order.create({
        creatorId: req.body.userId,
        recieverId: req.body.userId,
        statusId: status?._id,
        paymentId: payment._id,
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        fromLocation_placeId: req.body.fromLocation_placeId,
        fromLocationPolygon:
            req.body.fromLocationBounds != null
                ? {
                      type: 'Polygon',
                      coordinates: convertBoundsToPolygon(
                          req.body.fromLocationBounds
                      ),
                  }
                : undefined,
        toLocation_placeId: req.body.toLocation_placeId,
        toLocationPolygon: {
            type: 'Polygon',
            coordinates: convertBoundsToPolygon(req.body.toLocationBounds),
        },
        productName: req.body.productName,
        productUri: req.body.productUri,
        productWeight: req.body.productWeight,
        productDescription: req.body.productDescription,
    });

    return res.status(200).send({
        message: 'Order successfully created!',
    });
};
