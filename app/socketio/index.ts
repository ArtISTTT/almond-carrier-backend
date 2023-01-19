import { Socket } from 'socket.io';
import { Client } from 'socket.io/dist/client';

class WebSockets {
    connection(socket: Socket) {
        socket.emit('connected');

        socket.on('connect-to-order', (orderId: string) => {
            socket.join(orderId);
        });
    }
}

export default new WebSockets();
