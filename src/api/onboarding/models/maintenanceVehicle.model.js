const MaintenanceVehicle = require ("../../../db/schemas/maintenanceVehicleSchema")

const maintenanceVehicleFunction=async(req,res)=>{
    const {vehicleTableId, startDate, endDate}=req.body;
    if(!vehicleTableId || !startDate || !endDate){
        return res.json({
            status: 400,
            message: "Missing required fields: vehicleTableId, startDate, or endDate"
        });
    }
    try {

       
            if (!startDate && !endDate ){
                return res.json ({
                status: 400,
                message: "maintenance start and end dates are required.",
                data: [],
              });
            }
          
      
      
          function isValidISO8601(dateString) {
            const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
          
            // Check if the format matches the ISO 8601 pattern
            if (!iso8601Regex.test(dateString)) {
              return false;
            }
          
            // Check if it's a valid date
            const date = new Date(dateString);
            return !isNaN(date.getTime());
          }
      
          const startDateValidation = isValidISO8601(startDate);
        const endDateValidation = isValidISO8601(endDate);
       
      //console.log(startDateValidation,endDateValidation)
        if (!startDateValidation || !endDateValidation) {
          return {
            status: 400,
            message: "Invalid date format",
            data: [],
          };
        }

        const ObjDta = { vehicleTableId, startDate, endDate };

        // Save the log to the database
        const newData = new MaintenanceVehicle(ObjDta);
        await newData.save();

        

        return res.status(200).json({
            status: 200,
            message: "Vehicle add successfully in maintenance",
           
        });
        
    } catch (error) {
        console.error("Error during KYC approval:", error);
        return res.json({
            status: 500,
            message: "Internal server error"
        });
    }
}


module.exports={maintenanceVehicleFunction}