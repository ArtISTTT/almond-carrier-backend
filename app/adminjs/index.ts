import AdminJSExpress from '@adminjs/express';
import AdminJSMongoose from '@adminjs/mongoose';
import AdminJS, { ActionContext, ActionRequest, ActionResponse } from 'adminjs';
import {
    confirmPaymentByAdmin,
    confirmPayoutByAdmin,
    confirmVerificationByAdmin,
} from '../controllers/order.controller.admin';
import db from '../models';
import { componentLoader, Components } from './components';
import { default as dashboardHandler, default as logRoutes } from './logRoutes';

const { order } = db;
const { user } = db;
const { orderStatus } = db;
const { payment } = db;
const { review } = db;
const { role } = db;
const { chatMessage } = db;
const { image } = db;

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
        dashboard: {
            component: Components.LogViewer,
            handler: dashboardHandler,
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

                                if (record != null) {
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

                                if (record != null) {
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

                                if (record != null) {
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
        componentLoader,
    });

    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
        authenticate: async (email, password) => {
            if (password === 'adminpassword' && email === 'admin@admin.com') {
                return true;
            }
            return null;
        },
        cookieName: 'adminJs',
        cookiePassword: 'cookiePassword000',
    });

    adminRouter.use(logRoutes);

    return { rootPath: admin.options.rootPath, adminRouter };
};
