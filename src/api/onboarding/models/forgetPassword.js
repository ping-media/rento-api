const User = require("../../../db/schemas/onboarding/user.schema");
const { emailOtp, verify } = require("../models/otpSendByEmail");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const bcrypt = require("bcrypt");


const forgetPasswordFunction = async (req, res) => {
    try {
        const { email, password, otp, userType } = req.body;

        if (userType === "admin") {

            if (!email || !password) {
                return res.status(400).json({
                    status: 400,
                    message: "Email and Password are required",
                });
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
            if (!passwordRegex.test(password)) {
                return { status: 400, message: "Password validation not match" };
            }
            const hasPassword = bcrypt.hashSync(password, 8);

            const user = await User.findOneAndUpdate(
                { email },
                { $set: { password: hasPassword } },  
                { new: true }
            );

            return res.status(200).json({
                status: 200,
                message: "password changed successfully",
                
            });
        }

        if (!email || !otp || !password) {
            return res.status(400).json({
                status: 400,
                message: "Email, Password and OTP are required",
            });
        }

        const record = await Otp.findOne({ email });
        if (!record) {
            return res.status(404).json({
                status: 404,
                message: "No OTP found for the given email",
            });
        }

        if (new Date() > record.expiresAt) {
            await Otp.deleteOne({ email });
            return res.status(404).json({
                status: 404,
                message: "OTP has expired",
            });
        }

        if (otp !== record.otp) {
            return res.status(401).json({
                status: 401,
                message: "Invalid OTP",
            });
        }

        const userData = await User.findOne({email});
       

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        if (!passwordRegex.test(password)) {
            return { status: 400, message: "Password validation not match" };
        }
       const hasPassword = bcrypt.hashSync(password, 8);

       const obj ={}

       const user = await User.findOneAndUpdate(
        { email },
        { $set: { password: hasPassword } },  
        { new: true }
    );

        // console.log(user)

        await Otp.deleteOne({ email });

        return res.status(200).json({
            status: 200,
            message: "password changed successfully",
           
        });

    } catch (error) {
        res.json({ status: 500, message: error.message })
    }
}

module.exports = { forgetPasswordFunction }