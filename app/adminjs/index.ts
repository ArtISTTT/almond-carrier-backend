import AdminJSExpress from '@adminjs/express';
import AdminJSMongoose from '@adminjs/mongoose';
import AdminJS, { ActionContext, ActionRequest, ActionResponse } from 'adminjs';
import {
    confirmPaymentByAdmin,
    confirmPayoutByAdmin,
    confirmVerificationByAdmin,
} from '../controllers/order.controller.admin';
import db from '../models';

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
        branding: {
            companyName: 'Friednly Carrier',
        },
        resources: [
            {
                resource: order,
                options: {
                    actions: {
                        confirmPayment: {
                            actionType: 'record',
                            component: false,
                            guard: 'doYouWantToConfirmPayment?',
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
                        confirmPayout: {
                            actionType: 'record',
                            component: false,
                            guard: 'doYouWantToConfirmPayout?',
                            handler: (
                                request: ActionRequest,
                                response: ActionResponse,
                                context: ActionContext
                            ) => {
                                const { record, currentAdmin } = context;

                                if (record) {
                                    confirmPayoutByAdmin(record);
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
            {
                resource: user,
                options: {
                    actions: {
                        verificate: {
                            actionType: 'record',
                            component: false,
                            guard: 'doYouWantToVerificate?',
                            handler: (
                                request: ActionRequest,
                                response: ActionResponse,
                                context: ActionContext
                            ) => {
                                const { record, currentAdmin } = context;

                                if (record) {
                                    confirmVerificationByAdmin(record);
                                }

                                return {
                                    record: record?.toJSON(currentAdmin),
                                    msg: 'Confirmed verification',
                                };
                            },
                        },
                    },
                },
            },
            { resource: orderStatus },
            { resource: payment },
            { resource: review },
            { resource: role },
            { resource: chatMessage },
            { resource: image },
        ],
    });

    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
        authenticate: async (email, password) => {
            if ('adminpassword' === password && 'admin@admin.com' === email) {
                return true;
            }
            return null;
        },
        cookieName: 'adminJs',
        cookiePassword: 'cookiePassword000',
    });

    return { rootPath: admin.options.rootPath, adminRouter };
};
