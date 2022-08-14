export type SpritesmithCoordinates = {
    [filePath: string]: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

export type SpritesmithResult = {
    image: Uint8Array;
    coordinates: SpritesmithCoordinates;
    properties: {
        width: number;
        height: number;
    };
};

export type SpriteSheet = {
    image: Uint8Array;
    css: string;
};
