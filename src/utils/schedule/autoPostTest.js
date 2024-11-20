const { SchedulePost } = require('../../db/schemas/schedulerSchema/postSchema');

const moment = require('moment');

function addOneMinute() {
  const now = moment(); // get present dateTime
  const newDateTime = now.add(1, 'minutes'); // add 1 minute to present dateTime
  return newDateTime;
}


const Data = [
  {
    "brandId" : "643ced9d3da5c0c49381113d",
    "socialId" : "643cf164138a19e5073cc6c5",
    "socialAccountName" : "instagram",
    "publishType" : "schedule",
    "postType" : "image",
    "message" : `test data post time ${addOneMinute(new Date())}`,
    "firstComment" : "",
    "shopGridLink" : "",
    "location" : "123455",
    "imageUrl" : [
        "https://images.unsplash.com/photo-1678951600673-13ba60f38e4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=Mnw0MTczODZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE2ODE3MTU2Njc&ixlib=rb-4.0.3&q=80&w=1080"
    ],
    "publishDateTime" : addOneMinute(new Date()),
    "tags" : [

    ],
    "scheduleType" : "now",
    "status" : "pending",
}
  ]



  // create post on every one minute

async function createPost() {
    // const result = await SchedulePost(Data)
    for (let post of Data) {
        // publishDateTime: {$lte: addOneMinute(new Date())}
        post['publishDateTime'] = addOneMinute()
        const result = new SchedulePost(post)
        await result.save()
        console.log('post created');
    }
}
  
module.exports = { createPost }