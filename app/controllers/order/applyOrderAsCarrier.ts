import { Request, Response } from 'express';
import * as core from 'express-serve-static-core';
import { notificationText } from '../../frontendTexts/notifications';
import { convertBoundsToPolygon } from '../../helpers/initialize/convertBoundsToPolygon';
import db from '../../models';
import { IBounds } from '../../types/geometry';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;

type IReqSApplyAsCarrier = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        orderId: string;
        fromLocation?: string;
        fromLocation_placeId?: string;
        fromLocationBounds?: IBounds;
        arrivalDate: Date;
    }
>;

export const applyOrderAsCarrier = async (
    req: IReqSApplyAsCarrier,
    res: Response
) => {
    const status = await OrderStatus.findOne({ name: 'inDiscussion' });

    if (status == null) {
        return res.status(404).send({ message: 'Status not found!' });
    }

    const fromLocationData =
        req.body.fromLocation && req.body.fromLocationBounds != null
            ? {
                  fromLocation: req.body.fromLocation,
                  fromLocation_placeId: req.body.fromLocation_placeId,
                  fromLocationPolygon: {
                      type: 'Polygon',
                      coordinates: convertBoundsToPolygon(
                          req.body.fromLocationBounds
                      ),
                  },
              }
            : {};

    const order = await Order.findByIdAndUpdate(
        { _id: req.body.orderId },
        {
            $set: {
                carrierId: req.body.userId,
                ...fromLocationData,
                arrivalDate: req.body.arrivalDate,
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    if (order == null) {
        return res.status(404).send({ message: 'Order to apply not found!' });
    }

    global.io.sockets.in(req.body.orderId).emit('new-status');

    await addNewNotification({
        text: notificationText.carrierFound,
        orderId: req.body.orderId,
        userForId: String(order.recieverId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ orderId: order._id });
};
