const Timeline = require("../../../db/schemas/onboarding/timeline.schema");

const timelineFunction = async (req, res) => {
  try {
    const { bookingId, userId, timeLine, currentBooking_id, isStart} = req.body;

if(isStart && isStart===true)
    {
      if (!bookingId || !userId || !timeLine) {
      return res.json({
        status: 400,
        message: "Missing required fields: userId, bookingId, or timeline.",
      });
    }

    const ObjData = { userId, bookingId, timeLine };
    const newData = new Timeline(ObjData);
    await newData.save();

    return res.json({
      status: 200,
      message: "Timeline added successfully",
    });

  }
  else{
   

   
      const existingData = await Timeline.findOne({ bookingId });
      console.log(existingData)

      if (!existingData) {
        return res.json({
          status: 404,
          message: "Document not found",
        });
      }

      const updatedTimeline = {...existingData.timeLine, ...timeLine};

      await Timeline.updateOne(
        { bookingId },
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
