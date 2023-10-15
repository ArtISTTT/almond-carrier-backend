export interface IBounds {
    northeast: {
        lat: number;
        lng: number;
    };
    southwest: {
        lat: number;
        lng: number;
    };
}

export type IPolygon = Array<Array<[number, number]>>;
