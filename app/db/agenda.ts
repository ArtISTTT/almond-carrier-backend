import Agenda, { Job } from 'agenda';
import db from '../models';

const connectionString = process.env.MONGO_URL as string;

export const agendaInstance = new Agenda({ db: { address: connectionString } });

const Order = db.order;
const OrderStatus = db.orderStatus;

agendaInstance.define('cancelOrder', async (job: Job) => {
    const status = await OrderStatus.findOne({ name: 'cancelled' });

    if (status == null) {
        return;
    }

    const orderId = job.attrs.data.orderId;
    await Order.findByIdAndUpdate(
        { _id: orderId },
        {
            $set: {
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );
});
