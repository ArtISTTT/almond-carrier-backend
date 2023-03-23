import { Request, Response } from 'express';
import * as core from 'express-serve-static-core';
import mongoose from 'mongoose';
import { convertBoundsToPolygon } from '../../helpers/initialize/convertBoundsToPolygon';
import db from '../../models';
import { getOrdersOutput } from '../../services/getOrdersOutput';
import { IBounds } from '../../types/geometry';

enum OrderSeachType {
    receivers = 'receivers',
    carriers = 'carriers',
}

type Filter = {
    fromLocation_placeId?: string;
    toLocation_placeId?: string;
    fromLocationBounds: IBounds;
    toLocationBounds: IBounds;
    maxBenefit?: number;
    minBenefit?: number;
    maxWeight?: number;
    maxPrice?: number;
};

type IReqSearchOrders = Request<
    core.ParamsDictionary,
    {},
    {
        userId: string;
        type: OrderSeachType;
        filters: Filter;
        start: number;
        limit: number;
    }
>;

const User = db.user;
const Order = db.order;
const OrderStatus = db.orderStatus;
const Payment = db.payment;
const Review = db.review;

export const searchOrders = async (req: IReqSearchOrders, res: Response) => {
    const ordersList = [];

    // GETTING CARRIERS LIST BY FILTERS

    if (req.body.type === OrderSeachType.carriers) {
        const matchOrderFilters = [
            {
                carrierId: {
                    $exists: true,
                    $ne: new mongoose.Types.ObjectId(req.body.userId),
                },
                recieverId: { $exists: false },
            },
        ]
            .concat(
                req.body.filters.fromLocation_placeId
                    ? ([
                          {
                              $or: [
                                  {
                                      fromLocation_placeId:
                                          req.body.filters.fromLocation_placeId,
                                  },
                                  {
                                      fromLocationPolygon: {
                                          $geoWithin: {
                                              $geometry: {
                                                  type: 'Polygon',
                                                  coordinates:
                                                      convertBoundsToPolygon(
                                                          req.body.filters
                                                              .fromLocationBounds
                                                      ),
                                              },
                                          },
                                      },
                                  },
                              ],
                          },
                      ] as any)
                    : []
            )
            .concat(
                req.body.filters.toLocation_placeId
                    ? ([
                          {
                              $or: [
                                  {
                                      toLocation_placeId:
                                          req.body.filters.toLocation_placeId,
                                  },
                                  {
                                      toLocationPolygon: {
                                          $geoWithin: {
                                              $geometry: {
                                                  type: 'Polygon',
                                                  coordinates:
                                                      convertBoundsToPolygon(
                                                          req.body.filters
                                                              .toLocationBounds
                                                      ),
                                              },
                                          },
                                      },
                                  },
                              ],
                          },
                      ] as any)
                    : []
            )
            .concat(
                req.body.filters.maxWeight
                    ? ([
                          {
                              carrierMaxWeight: {
                                  $lte: req.body.filters.maxWeight,
                              },
                          },
                      ] as any)
                    : []
            );

        const matchPayment: mongoose.FilterQuery<any> = {
            $expr: { $eq: ['$$paymentId', '$_id'] },
        };

        if (req.body.filters.maxBenefit) {
            matchPayment.rewardAmount = {
                $lte: req.body.filters.maxBenefit,
            };
        }

        const orders = await Order.aggregate([
            {
                $match: { $and: matchOrderFilters },
            },
            { $sort: { createdAt: -1 } },
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
                    $and: [
                        {
                            'status.name': {
                                $ne: 'success',
                            },
                        },
                        {
                            'status.name': {
                                $ne: 'cancelled',
                            },
                        },
                    ],
                },
            },
            {
                $skip: req.body.start,
            },
            {
                $limit: req.body.limit,
            },
            {
                $lookup: {
                    from: Payment.collection.name,
                    let: { paymentId: '$paymentId' },
                    pipeline: [
                        {
                            $match: matchPayment,
                        },
                    ],
                    as: 'payment',
                },
            },
            {
                $unwind: '$payment',
            },
            {
                $lookup: {
                    from: User.collection.name,
                    localField: 'carrierId',
                    foreignField: '_id',
                    as: 'carrier',
                },
            },
            {
                $unwind: '$carrier',
            },
            {
                $lookup: {
                    from: Review.collection.name,
                    let: {
                        carrierId: '$carrierId',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$$carrierId', '$userForId'] },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                averageRating: {
                                    $avg: '$rating',
                                },
                            },
                        },
                    ],
                    as: 'carrierRating',
                },
            },
            {
                $unwind: {
                    path: '$carrierRating',
                    preserveNullAndEmptyArrays: true,
                },
            },
        ]);

        const ordersCount = (
            await Order.aggregate([
                {
                    $match: { $and: matchOrderFilters },
                },
                { $count: 'count' },
            ])
        )[0];

        return res.status(200).send({
            orders: await getOrdersOutput(orders, req.query.language as string),
            count: ordersCount?.count,
        });
    }

    // GETTING RECEIVERS LIST BY FILTERS

    const matchOrderFilters = [
        {
            recieverId: {
                $exists: true,
                $ne: new mongoose.Types.ObjectId(req.body.userId),
            },
            carrierId: { $exists: false },
        },
    ]
        .concat(
            req.body.filters.fromLocation_placeId
                ? ([
                      {
                          $or: [
                              {
                                  fromLocation_placeId:
                                      req.body.filters.fromLocation_placeId,
                              },
                              {
                                  fromLocationPolygon: {
                                      $geoWithin: {
                                          $geometry: {
                                              type: 'Polygon',
                                              coordinates:
                                                  convertBoundsToPolygon(
                                                      req.body.filters
                                                          .fromLocationBounds
                                                  ),
                                          },
                                      },
                                  },
                              },
                          ],
                      },
                  ] as any)
                : []
        )
        .concat(
            req.body.filters.toLocation_placeId
                ? ([
                      {
                          $or: [
                              {
                                  toLocation_placeId:
                                      req.body.filters.toLocation_placeId,
                              },
                              {
                                  toLocationPolygon: {
                                      $geoWithin: {
                                          $geometry: {
                                              type: 'Polygon',
                                              coordinates:
                                                  convertBoundsToPolygon(
                                                      req.body.filters
                                                          .toLocationBounds
                                                  ),
                                          },
                                      },
                                  },
                              },
                          ],
                      },
                  ] as any)
                : []
        )
        .concat(
            req.body.filters.maxWeight
                ? ([
                      {
                          productWeight: {
                              $lte: req.body.filters.maxWeight,
                          },
                      },
                  ] as any)
                : []
        );

    const matchPayment: mongoose.FilterQuery<any> = {
        $expr: { $eq: ['$$paymentId', '$_id'] },
    };

    if (req.body.filters.minBenefit) {
        matchPayment.rewardAmount = {
            $gte: req.body.filters.minBenefit,
        };
    }

    if (req.body.filters.maxPrice) {
        matchPayment.productAmount = {
            $lte: req.body.filters.maxPrice,
        };
    }

    const orders = await Order.aggregate([
        {
            $match: { $and: matchOrderFilters },
        },
        {
            $sort: {
                update_at: -1,
            },
        },
        {
            $skip: req.body.start,
        },
        {
            $limit: req.body.limit,
        },
        {
            $lookup: {
                from: Payment.collection.name,
                let: { paymentId: '$paymentId' },
                pipeline: [
                    {
                        $match: matchPayment,
                    },
                ],
                as: 'payment',
            },
        },
        {
            $unwind: '$payment',
        },
        {
            $lookup: {
                from: User.collection.name,
                localField: 'recieverId',
                foreignField: '_id',
                as: 'receiver',
            },
        },
        {
            $unwind: '$receiver',
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
            $lookup: {
                from: Review.collection.name,
                let: {
                    recieverId: '$recieverId',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$$recieverId', '$userForId'] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            averageRating: {
                                $avg: '$rating',
                            },
                        },
                    },
                ],
                as: 'recieverRating',
            },
        },
        {
            $unwind: {
                path: '$recieverRating',
                preserveNullAndEmptyArrays: true,
            },
        },
    ]);

    const ordersCount = (
        await Order.aggregate([
            {
                $match: { $and: matchOrderFilters },
            },
            { $count: 'count' },
        ])
    )[0];

    return res.status(200).send({
        orders: await getOrdersOutput(orders, req.query.language as string),
        count: ordersCount?.count,
    });
};
