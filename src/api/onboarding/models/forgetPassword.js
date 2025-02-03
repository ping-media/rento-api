const User = require("../../../db/schemas/onboarding/user.schema");
//const { Otp, verify } = require("../models/otpSendBycontact");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const bcrypt = require("bcrypt");


const forgetPasswordFunction = async (req, res) => {
    try {
        const {contact_For, password_For, otp, userType } = req.body;

        const contact = contact_For;
        const password = password_For;
       // console.log(contact,password)

        if (userType === "admin") {

            if (!contact || !password) {
                return res.status(400).json({
                    status: 400,
                    message: "contact and Password are required",
                });
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
            if (!passwordRegex.test(password)) {
                return { status: 400, message: "Password validation not match" };
            }
            const hasPassword = bcrypt.hashSync(password, 8);

            const user = await User.findOneAndUpdate(
                { contact },
                { $set: { password: hasPassword } },  
                { new: true }
            );

            return res.status(200).json({
                status: 200,
                message: "password changed successfully",
                
            });
        }

        if (!contact || !otp || !password) {
            return res.status(400).json({
                status: 400,
                message: "contact, Password and OTP are required",
            });
        }

        const record = await Otp.findOne({ contact });
        if (!record) {
            return res.status(404).json({
                status: 404,
                message: "No OTP found for the given contact",
            });
        }

        if (new Date() > record.expiresAt) {
            await Otp.deleteOne({ contact });
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

        const userData = await User.findOne({contact});
       

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        if (!passwordRegex.test(password)) {
            return { status: 400, message: "Password validation not match" };
        }
       const hasPassword = bcrypt.hashSync(password, 8);

      

       const user = await User.findOneAndUpdate(
        { contact },
        { $set: { password: hasPassword } },  
        { new: true }
    );

        // console.log(user)

        await Otp.deleteOne({ contact });

        return res.status(200).json({
            status: 200,
            message: "password changed successfully",
           
        });

    } catch (error) {
        res.json({ status: 500, message: error.message })
    }
}

module.exports = { forgetPasswordFunction }