import { transporter } from './transporter';

export const sendRecoverPasswordEmail = (link: string, email: string) => {
    transporter.sendMail(
        {
            from: 'support@friendlycarrier.com',
            to: email,
            subject: 'Recover password',
            text: `To recover password, please follow the link: ${link}`,
        },
        (err, info) => {
            console.log('SENDED', err, info);

            if (err != null) {
                console.log(err);
            } else {
                console.log(info);
            }
        }
    );
};

export const sendRecoverPasswordSuccessfullyEmail = (
    name: string,
    email: string
) => {
    transporter.sendMail(
        {
            from: 'support@friendlycarrier.com',
            to: email,
            subject: 'Recover password',
            text: `${name}, password successfully updated! Login: https://friendlycarrier.com/signin`,
        },
        (err, info) => {
            console.log('SENDED', err, info);

            if (err != null) {
                console.log(err);
            } else {
                console.log(info);
            }
        }
    );
};
