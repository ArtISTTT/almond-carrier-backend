import mongoose from 'mongoose';
import { ImageModel } from './image.model';
import { NotificationModel } from './notification.model';
import { OrderModel } from './order.model';
import { OrderStatusModel } from './orderStatus.model';
import { PaymentModel } from './payment.model';
import { ReviewModel } from './review.model';
import { RoleModel } from './role.model';
import { TokenModel, TokenModel } from './token.model';
import { UserModel } from './user.model';

mongoose.Promise = global.Promise;

interface IDB {
    mongoose: typeof mongoose;
    user: typeof UserModel;
    token: typeof TokenModel;
    role: typeof RoleModel;
    order: typeof OrderModel;
    orderStatus: typeof OrderStatusModel;
    payment: typeof PaymentModel;
    review: typeof ReviewModel;
    image: typeof ImageModel;
    notification: typeof NotificationModel;
    chatMessage: typeof ChatMessageModel;
    ROLES: ['user', 'admin', 'moderator'];
}

const db: any = {};

db.mongoose = mongoose;

db.mongoose.set('strictQuery', false);

db.user = UserModel;
db.token = TokenModel;
db.role = RoleModel;

db.order = OrderModel;
db.orderStatus = OrderStatusModel;
db.payment = PaymentModel;
db.review = ReviewModel;
db.image = ImageModel;
db.chatMessage = ChatMessageModel;
db.notification = NotificationModel;

db.ROLES = ['user', 'admin', 'moderator'];

export default db as IDB;
