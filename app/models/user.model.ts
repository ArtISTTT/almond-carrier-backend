import mongoose, { Document, Types } from 'mongoose';

interface IDVerification {
    isVerificated: boolean;
    // If there are more fields in the idVerification object, add them here
}

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gender?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    roles: Types.ObjectId[]; // This assumes that roles are an array of ObjectIDs referring to 'Role'
    avatarImage?: string;
    verificated: boolean;
    idVerification?: IDVerification;
    createdAt?: Date; // Added due to `timestamps: true`
    updatedAt?: Date; // Added due to `timestamps: true`
}

export const UserModel = mongoose.model<IUser>(
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
