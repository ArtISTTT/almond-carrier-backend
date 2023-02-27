import AdminJSExpress from '@adminjs/express';
import AdminJSMongoose from '@adminjs/mongoose';
import AdminJS, { ActionContext, ActionRequest, ActionResponse } from 'adminjs';
import db from '../models';
import { Request, Response } from 'express';
import { confirmPaymentByAdmin } from '../controllers/order.controller.admin';

const order = db.order;
const user = db.user;
const orderStatus = db.orderStatus;
const payment = db.payment;
const review = db.review;
const role = db.role;
const chatMessage = db.chatMessage;
const image = db.image;

const DEFAULT_ADMIN = {
    email: 'admin@mail.ru',
    password: 'passwordadmin',
};

export const getAdminJs = () => {
    AdminJS.registerAdapter(AdminJSMongoose);

    const admin = new AdminJS({
        resources: [
            {
                resource: order,
                options: {
                    actions: {
                        confirmPayment: {
                            actionType: 'record',
                            component: false,
                            handler: (
                                request: ActionRequest,
                                response: ActionResponse,
                                context: ActionContext
                            ) => {
                                const { record, currentAdmin } = context;

                                if (record) {
                                    confirmPaymentByAdmin(record);
                                }

                                return {
                                    record: record?.toJSON(currentAdmin),
                                    msg: 'Confirmed payment',
                                };
                            },
                        },
                    },
                },
            },
            { resource: user },
            { resource: orderStatus },
            { resource: payment },
            { resource: review },
            { resource: role },
            { resource: chatMessage },
            { resource: image },
        ],
    });

    const adminRouter = AdminJSExpress.buildRouter(admin);

    return { rootPath: admin.options.rootPath, adminRouter };
};
