import { Socket } from 'socket.io';

class WebSockets {
    async connection(socket: Socket) {
        socket.emit('connected');

        socket.on('connect-to-order', async (orderId: string) => {
            await socket.join(orderId);
        });

        socket.on('disconnect-from-order', async (orderId: string) => {
            await socket.leave(orderId);
        });

        socket.on('connect-to-client', async (userId: string) => {
            await socket.join(userId);
        });
    }
}

export default new WebSockets();
