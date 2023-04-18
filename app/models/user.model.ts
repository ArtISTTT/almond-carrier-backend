import mongoose from 'mongoose';

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
            password: {
                type: String,
                required: true,
            },
            gender: {
                type: String,
                required: false,
                trim: true,
            },
            phoneNumber: {
                type: String,
                required: false,
                trim: true,
            },
            dateOfBirth: Date,
            roles: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Role',
                },
            ],
            avatarImage: {
                type: String,
                required: false,
            },
            verificated: {
                type: Boolean,
                required: true,
                default: false,
            },
            idVerification: {
                type: Object,
                required: false,
                default: {
                    isVerificated: false,
                },
            },
        },
        {
            timestamps: true,
        }
    )
);
