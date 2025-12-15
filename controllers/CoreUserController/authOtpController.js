const UserSchema = require("../../models/CoreUser/User");
const sendEmail = require("../../utils/email");
const db = require('../../config/db');

exports.requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const {connection} = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);

    const user = await UserModel.findOne({ email });

    if (!user) return res.status(404).json({ message: "Email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();

    await sendEmail(
      user.email,
      "🔐 Your OTP Code",
      `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    );

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: "OTP generation failed", error: err.message });
  }
};


exports.verifyOtpLogin = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const {connection} = await db.getUserSpecificConnection(req.user._id);
    const UserModel = connection.model('User', UserSchema);
    const user = await UserModel.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({
      message: "OTP verified",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};
