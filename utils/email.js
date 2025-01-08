const { Resend } = require('resend');

const resend = new Resend(`${process.env.EMAIL_API_KEY}`);

const sendEmail = async (options) => {

  await resend.emails.send({
    from: 'Herfa <support@callmekhiloo.tech>',
    to: `${options.email}`,
    subject: `${options.subject}`,
    html: `<strong>${options.message}</strong>`,
  });

};

module.exports = sendEmail;
