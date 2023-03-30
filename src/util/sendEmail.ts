import nodemailer from 'nodemailer';

export interface INodemailerEmailOptions {
    to: string;
    replyTo?: string;
    subject?: string;
    html?: string;
}

interface NodemailerTransportOptions extends INodemailerEmailOptions {
    from: string;
}

interface ITransport {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    }
    tls: {
        rejectUnauthorized: boolean;
    }
    sendMail: (options: NodemailerTransportOptions, callback: (err: Error | null, info: object) => void) => void;
}

const sendEmail = async ({ subject, html, to, replyTo }: INodemailerEmailOptions) => {
    const transport: ITransport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: '465',
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass:  process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const options: NodemailerTransportOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        replyTo: replyTo,
        subject: subject,
        html: html
    }

    //Send Email
    const result = await transport.sendMail(options, function(err, info) {
        if(err) {
            return (err);
        } else {
            return (info);
        }
    });
    return result;
}

export default sendEmail;