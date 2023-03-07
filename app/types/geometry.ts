export type IBounds = {
    northeast: {
        lat: number;
        lng: number;
    };
    southwest: {
        lat: number;
        lng: number;
    };
};

export type IPolygon = [number, number][][];
