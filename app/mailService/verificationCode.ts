import { transporter } from './transporter';

export const sendVerification = (link: string, email: string) => {
    try {
        transporter.sendMail(
            {
                from: 'noreply@friendlycarrier.com',
                to: email,
                subject: 'Account verification code',
                text: `Your account verification link: ${link}`,
            },
            (err, info) => {
                if (err != null) {
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
