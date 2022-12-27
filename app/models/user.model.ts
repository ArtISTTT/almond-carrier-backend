const mongoose = require('mongoose');

export const UserModel = mongoose.model(
    'User',
    new mongoose.Schema(
        {
            firstName: {
                type: String,
                required: true,
                trim: true,
            },
            lastName: {
                type: String,
                required: true,
                trim: true,
            },
            email: {
                type: String,
                required: true,
                unique: true,
                trim: true,
            },
            password: String,
            dateOfBirth: Date,
            roles: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Role',
                },
            ],
        },
        {
            timestamps: true,
        }
    )
);
