import { Express } from 'express';
import {
    applyOrderAsCarrier,
    applyOrderAsReceiver,
    createOrderAsCarrier,
    createOrderAsReceiver,
    getMyOrders,
    getOrderById,
    searchOrders,
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
        [middlewares.authJwt.verifyToken],
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
};
