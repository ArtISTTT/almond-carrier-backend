import { Request, Response } from 'express';
import * as core from 'express-serve-static-core';
import { COMISSIONS } from '../../helpers/consts';
import { convertBoundsToPolygon } from '../../helpers/initialize/convertBoundsToPolygon';
import db from '../../models';
import { IBounds } from '../../types/geometry';

const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;

type IReqCreateOrderAsCarrier = Request<
    core.ParamsDictionary,
    {},
    {
        rewardAmount: number;
        currency: string;
        userId: string;
        fromLocation: string;
        fromLocation_placeId: string;
        fromLocationBounds: IBounds;
        toLocation: string;
        toLocation_placeId: string;
        toLocationBounds: IBounds;
        carrierMaxWeight: number;
        arrivalDate: Date;
    }
>;

export const createOrderAsCarrier = async (
    req: IReqCreateOrderAsCarrier,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'waitingReciever' });

    if (!status) {
        res.status(404).send({ message: 'Status not found' });
        return;
    }

    const payment = new Payment({
        rewardAmount: req.body.rewardAmount,
        currency: req.body.currency,
        paymentPaySystemComission: COMISSIONS.PAYMENT_CP_COMISSION,
        ourPaymentComission: COMISSIONS.DUE_OUR_COMISSION,
    });

    payment.save(err => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
    });

    await Order.create({
        creatorId: req.body.userId,
        carrierId: req.body.userId,
        statusId: status?._id,
        paymentId: payment._id,
        fromLocation: req.body.fromLocation,
        toLocation: req.body.toLocation,
        fromLocation_placeId: req.body.fromLocation_placeId,
        toLocation_placeId: req.body.toLocation_placeId,
        fromLocationPolygon: {
            type: 'Polygon',
            coordinates: convertBoundsToPolygon(req.body.fromLocationBounds),
        },
        toLocationPolygon: {
            type: 'Polygon',
            coordinates: convertBoundsToPolygon(req.body.toLocationBounds),
        },
        carrierMaxWeight: req.body.carrierMaxWeight,
        arrivalDate: req.body.arrivalDate,
    });

    return res.status(200).send({
        message: 'Order successfully created!',
    });
};
