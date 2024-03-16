import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    port: 465, // true for 465, false for other ports
    host: 'mail.privateemail.com',
    auth: {
        user: 'noreply@friendlycarrier.com',
        pass: 'w1e2c3k4l5b6',
    },
    secure: true,
});
