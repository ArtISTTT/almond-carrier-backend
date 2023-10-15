import { transporter } from './transporter';

export const sendCompletionCodeEmail = (code: string, email: string) => {
    transporter.sendMail(
        {
            from: 'support@friendlycarrier.com',
            to: email,
            subject: 'Recover password',
            text: `Your confirmation code: ${code}`,
        },
        (err, info) => {
            if (err != null) {
                console.log(err);
            } else {
                console.log(info);
            }
        }
    );
};
