import { Socket } from 'socket.io';
import { Client } from 'socket.io/dist/client';

class WebSockets {
    connection(socket: Socket) {
        console.log('[SOCKET.IO] Connected new user');

        socket.emit('connected');

        socket.on('connect-to-order', (orderId: string) => {
            console.log('[SOCKET.IO] connected to order');
            socket.join(orderId);
        });
    }
}

export default new WebSockets();
