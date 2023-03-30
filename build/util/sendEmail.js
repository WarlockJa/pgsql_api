import nodemailer from 'nodemailer';
const sendEmail = async ({ subject, html, to, replyTo }) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: '465',
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    const options = {
        from: process.env.EMAIL_USER,
        to: to,
        replyTo: replyTo,
        subject: subject,
        html: html
    };
    //Send Email
    const result = await transport.sendMail(options, function (err, info) {
        if (err) {
            return (err);
        }
        else {
            return (info);
        }
    });
    return result;
};
export default sendEmail;
//# sourceMappingURL=sendEmail.js.map