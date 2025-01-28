const kycApproval= require ("../../../db/schemas/onboarding/kycApproval.schema")
const User = require ("../../../db/schemas/onboarding/user.schema")

const kycApprovalFunction = async (req, res) => {
    const { userId, aadharNumber, licenseNumber } = req.body;

    
    if (!userId || !aadharNumber || !licenseNumber) {
        return res.json({
            status: 400,
            message: "Missing required fields: userId, aadharNumber, or licenseNumber"
        });
    }

    try {
        const doc = await kycApproval.findOne({userId});
       
        if (doc) {
            return res.json({
                status: 404,
                message: "Document already exits"
            });
        }

        const findDoc = await kycApproval.findOne({aadharNumber});
       
        if (findDoc) {
            return res.json({
                status: 404,
                message: "Document already exits"
            });
        }

        const user = await User.findById(userId);
        // console.log(user)
        if (!user) {
            return res.json({
                status: 404,
                message: "User not found"
            });
        }

        
       // const isAadharValid = validateAadhar(aadharNumber); 
        if (aadharNumber.length!=16) {
            return res.json({
                status: 400,
                message: "Invalid Aadhar number"
            });
        }

        
       // const isLicenseValid = validateLicense(licenseNumber); 
        if (licenseNumber.length!=16) {
            return res.json({
                status: 400,
                message: "Invalid license number"
            });
        }

      
       

       
        const ObjDta = { userId, aadharNumber, licenseNumber };

        // Save the log to the database
        const newData = new kycApproval(ObjDta);
        await newData.save();

        await User.updateOne({_id:userId},{kycApproved:"yes", drivingLicence:licenseNumber})

        return res.status(200).json({
            status: 200,
            message: "KYC approval completed successfully",
           
        });

    } catch (error) {
        console.error("Error during KYC approval:", error);
        return res.json({
            status: 500,
            message: "Internal server error"
        });
    }
};


module.exports = {kycApprovalFunction}