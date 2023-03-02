import { Express } from 'express';
import {
    agreeWithChanges,
    applyOrderAsCarrier,
    applyOrderAsReceiver,
    cancelOrder,
    completeOrder,
    confirmDeal,
    confirmPayment,
    createOrderAsCarrier,
    createOrderAsReceiver,
    disagreeWithChanges,
    getMyOrders,
    getOrderById,
    searchOrders,
    startPayout,
    suggestChangesByCarrier,
    suggestChangesByReceiver,
} from '../controllers/order.controller';

import middlewares from '../middlewares';

export default (app: Express) => {
    app.use((req, res, next) => {
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, Content-Type, Accept'
        );
        next();
    });

    app.post(
        '/api/order/create-order-as-carrier',
        [middlewares.authJwt.verifyToken],
        createOrderAsCarrier
    );

    app.post(
        '/api/order/create-order-as-receiver',
        [middlewares.authJwt.verifyToken],
        createOrderAsReceiver
    );

    app.get(
        '/api/order/get-my-orders',
        [middlewares.authJwt.verifyToken],
        getMyOrders
    );

    app.post(
        '/api/order/search-orders',
        [middlewares.authJwt.addUserIdToBodyIfTokenExists],
        searchOrders
    );

    app.post(
        '/api/order/apply-as-carrier',
        [middlewares.authJwt.verifyToken],
        applyOrderAsCarrier
    );

    app.post(
        '/api/order/apply-as-receiver',
        [middlewares.authJwt.verifyToken],
        applyOrderAsReceiver
    );

    app.get(
        '/api/order/get-order-by-id',
        [middlewares.authJwt.verifyToken],
        getOrderById
    );

    app.post(
        '/api/order/suggest-changes-by-carrier',
        [middlewares.authJwt.verifyToken],
        suggestChangesByCarrier
    );

    app.post(
        '/api/order/suggest-changes-by-receiver',
        [middlewares.authJwt.verifyToken],
        suggestChangesByReceiver
    );

    app.post(
        '/api/order/agree-with-changes',
        [middlewares.authJwt.verifyToken],
        agreeWithChanges
    );

    app.post(
        '/api/order/disagree-with-changes',
        [middlewares.authJwt.verifyToken],
        disagreeWithChanges
    );

    app.post(
        '/api/order/confirm-deal',
        [middlewares.authJwt.verifyToken],
        confirmDeal
    );

    app.post(
        '/api/order/confirm-payment',
        [middlewares.authJwt.verifyToken],
        confirmPayment
    );

    app.post(
        '/api/order/complete-order',
        [middlewares.authJwt.verifyToken],
        completeOrder
    );

    app.post(
        '/api/order/cancel-order',
        [middlewares.authJwt.verifyToken],
        cancelOrder
    );

    app.post(
        '/api/order/start-payout',
        [middlewares.authJwt.verifyToken],
        startPayout
    );
};
