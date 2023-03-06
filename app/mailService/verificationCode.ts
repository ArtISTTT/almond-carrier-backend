import { transporter } from './transporter';

export const sendVerification = (link: string, email: string) => {
    try {
        transporter.sendMail(
            {
                from: 'support@friendlycarrier.com',
                to: email,
                subject: 'Account verification code',
                text: `Your account verification code: ${link}`,
            },
            (err, info) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(info);
                }
            }
        );
    } catch (e) {
        console.log(e);
    }
};
