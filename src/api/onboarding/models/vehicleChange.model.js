const Booking= require("../../../db/schemas/onboarding/booking.schema");
const Log= require("../../../db/schemas/onboarding/log");
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Otp = require("../../../db/schemas/onboarding/logOtp");

const vehicleChangeInBooking= async(req,res)=>{
    const { vehicleTableId,  extent, _id, vehicleBasic, vehicleMasterId,contact,otp }=req.body;
    try {

        const bookingData= await Booking.findOne({_id:_id});
        if(!bookingData){
            res.json({status:401,message:"Booking not found"})
        }

        const otpRecord = await Otp.findOne({ contact });
        if (!otpRecord) {
          const message = "No OTP found for the given contact number";
          return res.json({ status: 404, message });
        }

        if (otp !== otpRecord.otp) {
            const message = "Invalid OTP";
            return res.json({ status: 401, message });
          }

          await Otp.deleteOne({ contact });


       

       const vehicleMasterData = await VehicleMaster.findOne({_id:vehicleMasterId});
       if(!vehicleMasterData){
        res.json({status:401,message:"vehicleMasterData not found"})
    }
       const {vehicleImage,vehicleBrand,vehicleName} = vehicleMasterData


       const o = {vehicleTableId,vehicleMasterId,bookingPrice,vehicleBasic,extent,vehicleImage,vehicleName,vehicleBrand}


       Object.keys(o).forEach((key) => {
        if (o[key] === undefined || o[key] === null || o[key] === "") {
          delete o[key];
        }
      });

       const updatedData = await Booking.updateOne({ _id: ObjectId(_id) }, { $set: o }, { new: true });

      await Log({
        message: `Vhicle changed for  this booking  ${_id} `,
        functionName: "vehicleChangeInBooking",
        
      });
      res.json({status:200,message:"vehicle Changed",data:updatedData})
        
    } catch (error) {
        res.json({status:500,message:error.message})
    }
}


module.exports={vehicleChangeInBooking}