import mongoose from 'mongoose';
import { CardModel } from './card.model';
import { ChatMessageModel } from './chatMessage.model';
import { ImageModel } from './image.model';
import { NotificationModel } from './notification.model';
import { OrderModel } from './order.model';
import { OrderStatusModel } from './orderStatus.model';
import { PaymentModel } from './payment.model';
import { ReviewModel } from './review.model';
import { RoleModel } from './role.model';
import { TokenModel } from './token.model';
import { UserModel } from './user.model';

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
    card: typeof CardModel;
    ROLES: ['user', 'admin', 'moderator'];
}

mongoose.Promise = global.Promise;

const db: IDB = {
    mongoose,
    ROLES: ['user', 'admin', 'moderator'],
    user: UserModel,
    token: TokenModel,
    role: RoleModel,
    order: OrderModel,
    orderStatus: OrderStatusModel,
    payment: PaymentModel,
    review: ReviewModel,
    image: ImageModel,
    chatMessage: ChatMessageModel,
    notification: NotificationModel,
    card: CardModel,
};

db.mongoose.set('strictQuery', false);

export default db;
