const Timeline = require("../../../db/schemas/onboarding/timeline.schema");

const timelineFunction = async (req, res) => {
  // function convertDate(inputDate) {
  //   // Split the date and time
  //   const [datePart, timePart] = inputDate.split(", ");
    
  //   // Rearrange the date to MM/DD/YYYY
  //   const [day, month, year] = datePart.split("/");
  //   const formattedDate = `${month}/${day}/${year}`;
    
  //   // Combine formatted date and time
  //   const fullDateTime = new Date(`${formattedDate} ${timePart}`);
    
  //   // Format the date to the desired output
  //   const options = {
  //     year: "numeric",
  //     month: "numeric",
  //     day: "numeric",
  //     hour: "numeric",
  //     minute: "numeric",
  //     second: "numeric",
  //     hour12: true,
  //   };
  //   return new Intl.DateTimeFormat("en-US", options).format(fullDateTime);
  // }
  try {
    const { bookingId, userId, currentBooking_id, timeLine, isStart} = req.body;

if(isStart && isStart===true)
    {
      if (!bookingId || !userId || !timeLine || !currentBooking_id) {
      return res.json({
        status: 400,
        message: "Missing required fields: userId, bookingId, or timeline.",
      });
    }

    const ObjData = { userId, bookingId, timeLine, currentBooking_id };
    const newData = new Timeline(ObjData);
    await newData.save();

    return res.json({
      status: 200,
      message: "Timeline added successfully",
    });

  }
  else{
      const existingData = await Timeline.findOne({ currentBooking_id });
      

      if (!existingData) {
        return res.json({
          status: 404,
          message: "Document not found",
        });
      }

      const updatedTimeline = {...existingData.timeLine, ...timeLine};

      await Timeline.updateOne(
        { currentBooking_id },
        { $set: { timeLine: updatedTimeline } }
      );

      return res.status(200).json({
        status: 200,
        message: "Timeline updated successfully",
      });
  }
    

   
  } catch (error) {
    console.error("Error in timelineFunction:", error.message);
    return res.json({
      status: 500,
      message: error.message,
    });
  }
};


const timelineFunctionForGet = async (req,res) =>{
  try {
    const {bookingId}=req.query;
    
    const data= await Timeline.findOne({bookingId});

    if(data){
      return res.json({
        status: 200,
        message: "data get successfully",
        data:data
      });
    }
    return res.json({
      status: 402,
      message: "data not found",
      data:[]
    });

  } catch (error) {
    return res.json({
      status: 500,
      message: error.message,
    });
  }
}
module.exports = { timelineFunction, timelineFunctionForGet};
