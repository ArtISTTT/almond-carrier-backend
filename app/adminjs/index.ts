import AdminJSExpress from '@adminjs/express';
import AdminJSMongoose from '@adminjs/mongoose';
import AdminJS from 'adminjs';
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
        resources: [
            { resource: order },
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
