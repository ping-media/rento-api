const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const logSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
      
    },
    functionName: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

logSchema.pre('save', function (next) {
  if (this.message) {
    this.message = this.message.toLowerCase(); 
  }
  if (this.functionName) {
    this.functionName = this.functionName.toLowerCase(); 
  }
  
 
  next();
});


const Logs = mongoose.model("Logs", logSchema);

module.exports = Logs;
