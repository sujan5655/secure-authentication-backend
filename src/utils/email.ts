import nodemailer from 'nodemailer';

interface SendEmailOptions {
  email: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });

  const mailOptions = {
    from: `"Shiv Shah" <${process.env.EMAIL_USER || 'shivashah612@gmail.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
