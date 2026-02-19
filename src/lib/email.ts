import Mailjet from 'node-mailjet';

// Initialize Mailjet client
if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
  console.warn("Mailjet API keys are missing. Email sending will fail.");
}

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC || '',
  process.env.MJ_APIKEY_PRIVATE || ''
);

export async function sendOtpEmail(to: string, otp: string, electionName: string, candidateName: string) {
  try {
    if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
        throw new Error("Mailjet API keys are not configured.");
    }

    const request = mailjet
      .post("send", { 'version': 'v3.1' })
      .request({
        "Messages": [
          {
            "From": {
              "Email": "noreply@secure-voting.com",
              "Name": "Secure Voting System"
            },
            "To": [
              {
                "Email": to,
                "Name": "Voter"
              }
            ],
            "Subject": "Confirm Your Vote - " + electionName,
            "TextPart": `Your OTP is: ${otp}`,
            "HTMLPart": `
              <h3>Confirm Your Vote</h3>
              <p>You are about to cast a vote in <strong>${electionName}</strong>.</p>
              <p>Selected Candidate: <strong>${candidateName}</strong></p>
              <p>Your One-Time Password (OTP) is:</p>
              <h2 style="background: #f0f0f0; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h2>
              <p>This code expires in 2 minutes.</p>
              <p>If you did not initiate this vote, please contact support immediately.</p>
            `,
            "CustomID": "VoteConfirmationOTP"
          }
        ]
      });

    const result = await request;
    console.log(`Email sent to ${to}:`, JSON.stringify(result.body));
    return result.body;
  } catch (err: any) {
    console.error('Mailjet Error:', err.statusCode, err.message);
    throw new Error(`Failed to send email: ${err.message}`);
  }
}
