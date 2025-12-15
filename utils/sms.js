const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

const sendSMS = async (to, body) => {
  await client.messages.create({
    body,
    to: `+91${to}`, // Assuming Indian numbers
    from: process.env.TWILIO_PHONE,
  });
};

module.exports = { sendSMS };
