import { Request, Response } from 'express';
import { notificationText } from '../../frontendTexts/notifications';
import { convertBoundsToPolygon } from '../../helpers/initialize/convertBoundsToPolygon';
import db from '../../models';
import {
    addNewNotification,
    NotificationType,
} from './../notification.controller';

const Order = db.order;
const Payment = db.payment;

export const agreeWithChanges = async (req: Request, res: Response) => {
    const order = await Order.findById(req.body.orderId);

    if (!order) {
        return res.status(404).send({ message: 'Order not found!' });
    }

    const notificationUserForId = order.byReceiverSuggestedChanges
        ? order.recieverId
        : order.carrierId;

    const payment = await Payment.findById(order.paymentId);

    if (!payment) {
        return res.status(404).send({ message: 'Payment not found!' });
    }

    // Inserting changes from suggested to root of Document
    await payment.updateOne(
        {
            $set: {
                productAmount:
                    order.byCarrierSuggestedChanges?.productAmount ??
                    order.byReceiverSuggestedChanges?.productAmount ??
                    payment.productAmount,
                rewardAmount:
                    order.byCarrierSuggestedChanges?.rewardAmount ??
                    order.byReceiverSuggestedChanges?.rewardAmount ??
                    payment.rewardAmount,
            },
        },
        { new: true, lean: true }
    );

    await order.updateOne(
        {
            $set: {
                arrivalDate:
                    order.byCarrierSuggestedChanges?.arrivalDate ??
                    order.byReceiverSuggestedChanges?.arrivalDate ??
                    order.arrivalDate,
                carrierMaxWeight:
                    order.byCarrierSuggestedChanges?.carrierMaxWeight ??
                    order.byReceiverSuggestedChanges?.carrierMaxWeight ??
                    order.carrierMaxWeight,
                fromLocation:
                    order.byCarrierSuggestedChanges?.fromLocation ??
                    order.byReceiverSuggestedChanges?.fromLocation ??
                    order.fromLocation,
                toLocation:
                    order.byCarrierSuggestedChanges?.toLocation ??
                    order.byReceiverSuggestedChanges?.fromLocation ??
                    order.toLocation,
                fromLocation_placeId:
                    order.byCarrierSuggestedChanges?.fromLocation_placeId ??
                    order.byReceiverSuggestedChanges?.fromLocation_placeId ??
                    order.fromLocation_placeId,
                fromLocationPolygon: order.byCarrierSuggestedChanges
                    ?.fromLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byCarrierSuggestedChanges.fromLocationBounds
                          ),
                      }
                    : order.byReceiverSuggestedChanges?.fromLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byReceiverSuggestedChanges
                                  .fromLocationBounds
                          ),
                      }
                    : order.fromLocationPolygon,
                toLocation_placeId:
                    order.byCarrierSuggestedChanges?.toLocation_placeId ??
                    order.byReceiverSuggestedChanges?.toLocation_placeId ??
                    order.toLocation_placeId,
                toLocationPolygon: order.byCarrierSuggestedChanges
                    ?.toLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byCarrierSuggestedChanges.toLocationBounds
                          ),
                      }
                    : order.byReceiverSuggestedChanges?.toLocationBounds
                    ? {
                          type: 'Polygon',
                          coordinates: convertBoundsToPolygon(
                              order.byReceiverSuggestedChanges.toLocationBounds
                          ),
                      }
                    : order.toLocationPolygon,
                productName:
                    order.byCarrierSuggestedChanges?.productName ??
                    order.byReceiverSuggestedChanges?.productName ??
                    order.productName,
                productUri:
                    order.byCarrierSuggestedChanges?.productUri ??
                    order.byReceiverSuggestedChanges?.productUri ??
                    order.productUri,
                productDescription:
                    order.byCarrierSuggestedChanges?.productDescription ??
                    order.byReceiverSuggestedChanges?.productDescription ??
                    order.productDescription,
                productWeight:
                    order.byCarrierSuggestedChanges?.productWeight ??
                    order.byReceiverSuggestedChanges?.productWeight ??
                    order.productWeight,
                byReceiverSuggestedChanges: undefined,
                byCarrierSuggestedChanges: undefined,
            },
        },
        { new: true, lean: true }
    );

    order.byReceiverSuggestedChanges = undefined;
    order.byCarrierSuggestedChanges = undefined;

    await order.save();

    global.io.sockets.in(req.body.orderId).emit('new-status');

    await addNewNotification({
        text: notificationText.changesHasBeenReviewed,
        orderId: req.body.orderId,
        userForId: String(notificationUserForId),
        notificationType: NotificationType.orderUpdate,
    });

    return res.status(200).send({ ok: true });
};
