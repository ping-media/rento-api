const Timeline = require("../../../db/schemas/onboarding/timeline.schema");

const timelineFunction = async(req,res)=>{

try {
    const { bookingId, userId, timeline, currentBooking_id}=req.body;

    // if(!bookingId || !userId || !timeline){
    //     return res.json({
    //         status:401,
    //          message: "Missing required fields: userId, bookingId, or timelineData"
    //     })
    // }
    
    const ObjData = { userId, bookingId, timeline };

    console.log(ObjData)

    if (currentBooking_id) {
        // Fetch the existing document
        const existingData = await Timeline.findOne({ currentBooking_id });
  
        if (!existingData) {
          return res.status(404).json({
            status: 404,
            message: "Document not found",
          });
        }
  
        
        const updatedTimeline = {
          ...existingData.timeline, 
          ...timeline, 
        };
  console.log(updatedTimeline)
        // Update the document in the database
        await Timeline.updateOne(
          {bookingId: currentBooking_id },
          { $set: { timeline: updatedTimeline } }
        );
  
        return res.status(200).json({
          status: 200,
          message: "Timeline updated successfully",
        });
      }
    // Save the log to the database
    const newData = new Timeline(ObjData);
    await newData.save();

    

    return res.status(200).json({
        status: 200,
        message: "timeline added successfully",
       
    });

} catch (error) {
   return res.json({
    status:500,
        message:error.message,
    })
}

}

module.exports = {timelineFunction}