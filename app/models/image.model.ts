import mongoose from 'mongoose';

export const ImageModel = mongoose.model(
    'Image',
    new mongoose.Schema({
        name: { type: String, required: true },
        uri: { type: String, required: true },
        img: {
            type: {
                data: { type: Buffer, required: true },
                contentType: { type: String, required: true },
            },
            required: true,
        },
    })
);
