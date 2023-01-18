export interface global {}
declare global {
    var io: socketio.Server<
        DefaultEventsMap,
        DefaultEventsMap,
        DefaultEventsMap,
        any
    >;
}
