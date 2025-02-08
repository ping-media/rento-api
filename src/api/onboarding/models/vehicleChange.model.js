const Booking= require("../../../db/schemas/onboarding/booking.schema");
const Log= require("../../../db/schemas/onboarding/log");
const VehicleMaster = require("../../../db/schemas/onboarding/vehicle-master.schema");
const Station = require("../../../db/schemas/onboarding/station.schema");
const Otp = require("../../../db/schemas/onboarding/logOtp");
const {whatsappMessage}=require("../../../utils/whatsappMessage")

const vehicleChangeInBooking= async(req,res)=>{
    const { vehicleTableId,  changeVehicle, _id,vehicleBasic,bookingPrice, vehicleMasterId,contact,otp,vehicleImage,vehicleBrand,vehicleName,managerContact,firstName}=req.body;
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


      
       const o = {vehicleTableId,vehicleMasterId,changeVehicle,vehicleImage,vehicleName,vehicleBrand,vehicleBasic,bookingPrice}


       Object.keys(o).forEach((key) => {
        if (o[key] === undefined || o[key] === null || o[key] === "") {
          delete o[key];
        }
      });

      const updatedData = await Booking.findOneAndUpdate(
        { _id: _id }, // Filter condition
        { $set: o },  // Update data
        { new: true } // Return the updated document
      );
      
    //   if (updatedData) {
    //     return res.status(200).json({
    //       status: 200,
    //       message: "Vehicle changed",
    //       data: updatedData,
    //     });
    //   } else {
    //     return res.status(404).json({
    //       status: 404,
    //       message: "Booking not found",
    //     });
    //   }
      
      await Log({
        message: `Vhicle changed for  this booking  ${_id} `,
        functionName: "vehicleChangeInBooking",
        
      });



      const station = await Station.findOne({ stationName:bookingData.stationName }).select("latitude longitude");
        if (!station) {
          console.error(`Station not found for stationName: ${stationName}`);
          return; 
        }
      
        const {latitude,longitude}=station
        
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        const Oldvehicle=`${changeVehicle.vehicleName}(${changeVehicle.vehicleNumber})`
        const Newvehicle=`${vehicleName}(${vehicleBasic.vehicleNumber})`
      const messageData = [
        firstName,
        bookingData.bookingId,
        Oldvehicle,
        Newvehicle,
        bookingData.stationName,
        mapLink,
        bookingPrice.diffAmount,
        "1223",
        bookingData.vehicleBasic.refundableDeposit,
        managerContact
      ]
      whatsappMessage(contact,"bike_change",messageData)
      res.json({status:200,message:"vehicle Changed",data:updatedData})
        
    } catch (error) {
        res.json({status:500,message:error.message})
    }
}


module.exports={vehicleChangeInBooking}