import Agenda, { Job } from 'agenda';
import db from '../models';

export const agendaInstance = new Agenda({ mongo: db.mongoose.connection.db });

const Order = db.order;
const OrderStatus = db.orderStatus;

agendaInstance.define('cancelOrder', async (job: Job) => {
    const status = await OrderStatus.findOne({ name: 'cancelled' });
    const waitingPaymentStatus = await OrderStatus.findOne({
        name: 'waitingForPayment',
    });

    const orderId = job.attrs.data.orderId;
    const order = await Order.findById(orderId);

    if (
        status == null ||
        waitingPaymentStatus === null ||
        order == null ||
        order.statusId.toString() !== waitingPaymentStatus._id.toString()
    ) {
        return;
    }

    await order.update(
        {
            $set: {
                statusId: status._id,
            },
        },
        { new: true, lean: true }
    );

    await order.save();
});
