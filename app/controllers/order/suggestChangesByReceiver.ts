import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { notificationText } from '../../frontendTexts/notifications';
import { convertBoundsToPolygon } from '../../helpers/initialize/convertBoundsToPolygon';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from '../notification.controller';

const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;

export const suggestChangesByReceiver = async (req: Request, res: Response) => {
    const orders = await Order.aggregate([
        {
            $match: {
                $and: [
                    { _id: new mongoose.Types.ObjectId(req.body.orderId) },
                    { byCarrierSuggestedChanges: undefined },
                ],
            },
        },
        {
            $lookup: {
                from: OrderStatus.collection.name,
                localField: 'statusId',
                foreignField: '_id',
                as: 'status',
            },
        },
        {
            $unwind: '$status',
        },
        {
            $match: {
                $or: [
                    {
                        'status.name': 'inDiscussion',
                    },
                    {
                        'status.name': 'waitingCarrier',
                    },
                    {
                        'status.name': 'waitingReviever',
                    },
                ],
            },
        },
    ]);

    const order = orders[0];

    if (order) {
        if (order.status.name === 'inDiscussion') {
            await Order.findByIdAndUpdate(
                { _id: order._id },
                {
                    $set: {
                        byReceiverSuggestedChanges: req.body.changes,
                        dealConfirmedByCarrier: false,
                        dealConfirmedByReceiver: false,
                    },
                },
                { new: true, lean: true }
            );

            global.io.sockets.in(req.body.orderId).emit('new-status');

            return res.status(200).send({ ok: true });
        }

        const payment = await Payment.findById(order.paymentId);

        if (payment == null) {
            return res.status(404).send({ message: 'Payment not found!' });
        }

        await payment.updateOne(
            {
                $set: {
                    productAmount:
                        req.body.changes.productAmount ?? payment.productAmount,
                    rewardAmount:
                        req.body.changes.rewardAmount ?? payment.rewardAmount,
                },
            },
            { new: true, lean: true }
        );

        await Order.findByIdAndUpdate(
            { _id: order._id },
            {
                $set: {
                    arrivalDate:
                        req.body.changes.arrivalDate ?? order.arrivalDate,
                    carrierMaxWeight:
                        req.body.changes.carrierMaxWeight ??
                        order.carrierMaxWeight,
                    fromLocation:
                        req.body.changes.fromLocation ?? order.fromLocation,
                    toLocation:
                        req.body.changes.fromLocation ?? order.toLocation,
                    fromLocation_placeId:
                        req.body.changes.fromLocation_placeId ??
                        order.fromLocation_placeId,
                    fromLocationPolygon: req.body.changes.fromLocationBounds
                        ? {
                              type: 'Polygon',
                              coordinates: convertBoundsToPolygon(
                                  req.body.fromLocationBounds
                              ),
                          }
                        : order.fromLocationPolygon,
                    toLocation_placeId:
                        req.body.changes.toLocation_placeId ??
                        order.toLocation_placeId,
                    toLocationPolygon: req.body.changes.toLocationBounds
                        ? {
                              type: 'Polygon',
                              coordinates: convertBoundsToPolygon(
                                  req.body.toLocationBounds
                              ),
                          }
                        : order.toLocationPolygon,
                    productName:
                        req.body.changes.productName ?? order.productName,
                    productUri: req.body.changes.productUri ?? order.productUri,
                    productDescription:
                        req.body.changes.productDescription ??
                        order.productDescription,
                    productWeight:
                        req.body.changes.productWeight ?? order.productWeight,
                    dealConfirmedByCarrier: false,
                    dealConfirmedByReceiver: false,
                },
            },
            { new: true, lean: true }
        );

        global.io.sockets.in(req.body.orderId).emit('new-status');

        if (order.carrierId) {
            await addNewNotification({
                text: notificationText.newChangesForReview,
                orderId: req.body.orderId,
                userForId: String(order.carrierId),
                notificationType: NotificationType.orderUpdate,
            });
        }

        return res.status(200).send({ ok: true });
    }

    return res.status(401).send({ message: 'Error while updating order!' });
};
