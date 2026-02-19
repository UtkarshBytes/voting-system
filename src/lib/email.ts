import nodemailer from 'nodemailer';

export async function sendOtpEmail(to: string, otp: string, electionName: string, candidateName: string) {
  // 1. Check Env Vars
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error("Gmail API credentials are not configured (GMAIL_USER, GMAIL_PASS).");
  }

  // 2. Create Transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  // 3. Send Mail
  try {
    const info = await transporter.sendMail({
      from: `"Secure Voting System" <${process.env.GMAIL_USER}>`, // sender address
      to: to, // list of receivers
      subject: "Confirm Your Vote - " + electionName, // Subject line
      text: `Your OTP is: ${otp}`, // plain text body
      html: `
        <h3>Confirm Your Vote</h3>
        <p>You are about to cast a vote in <strong>${electionName}</strong>.</p>
        <p>Selected Candidate: <strong>${candidateName}</strong></p>
        <p>Your One-Time Password (OTP) is:</p>
        <h2 style="background: #f0f0f0; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h2>
        <p>This code expires in 2 minutes.</p>
        <p>If you did not initiate this vote, please contact support immediately.</p>
      `, // html body
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error: any) {
    console.error("Error sending email via Gmail:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
