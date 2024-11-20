const SchedulePost = require('../../db/schemas/schedulerSchema/postSchema').SchedulePost;
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const { postToFacebookFeed, postToFacebookPhots, postToFacebook } = require('../../api/scheduler/utils/socialAccounts/facebookPage');
const { SocialAccounts } = require('../../db/schemas/onboarding/social.schema');
const { getSocialAccountDetails } = require('../../api/analytics/utils');
const { postToSocialAccount } = require('../../api/scheduler/utils');
const { createPost } = require('./autoPostTest');
require("dotenv").config();
const ObjectId = mongoose.Types.ObjectId
const moment = require("moment-timezone");

mongoose
    .connect(process.env.DB_URL)
    .then(() => console.log("mongo db is connected....", process.env.DB_URL))
    .catch((err) => console.log("error occurs while connecting time", err));


function addOneMinute(date) {
  const dt = date;
  dt.setMinutes(dt.getMinutes() + 3);
  const newTimestamp = dt.toISOString().slice(0, 19).replace('T', ' ');
  return newTimestamp;
}

module.exports = {
    addOneMinute
}

// const moment = require('moment');

const now = moment().utc(); // Get the current date and time
const future = now.add(1, 'minute'); // Add one minute to the current date and time

console.log(now.format()); // Output: 2023-04-04T08:30:45-07:00
console.log(future.format()); // Output: 2023-04-04T08:31:45-07:00


async function updatePublishedPost(id, postId, status, error= null) {
  try {
    const matchQuery = {
      _id: new ObjectId(id),
    };

    const updateQuery = {
      $set: {
        error: error,
        status,
        postId,
      },
    };
    const options = {
      new: true,
    };
    const updatedPost = await SchedulePost.findOneAndUpdate(matchQuery, updateQuery, options).lean();
    return updatedPost;
  } catch (error) {
    console.error('Error occurred while updating published post:', error);
    return null;
  }
}


const job = schedule.scheduleJob('*/60 * * * * *', async function() {
  try {
    // Get scheduled posts that are due to be published within the next minute
    console.log('Getting scheduled posts to publish...');
    // take utc time for updating the post
    console.log('utc time', moment.utc().format('YYYY-MM-DD HH:mm:ss'))
    const currentDate = new Date(moment.utc().format('YYYY-MM-DD HH:mm:ss'));
    const futureDate = new Date(currentDate);
    futureDate.setMinutes(currentDate.getMinutes() + 1);
    
    const matchQuery = {
      publishDateTime: { $gte: currentDate, $lt: futureDate },
      status: 'pending',
      postId: null,
    };
    
    
    console.log('match query =>', matchQuery);
    const scheduledPosts = await SchedulePost.find(matchQuery).lean();
    console.table('Scheduled posts to publish:', scheduledPosts);
    console.log('post count', scheduledPosts.length);

    if (scheduledPosts.length > 0) {

            // get social accounts details
            for (const post of scheduledPosts) {
              try {
                const socialAccount = await getSocialAccountDetails(post.socialId, post.socialAccountName);

                // post to social accounts
                const result = await postToSocialAccount(socialAccount.accessToken, socialAccount.pageId, post);

                // update into the database
                await updatePublishedPost(post._id, result, 'published');

                // return updatedPost;
              } catch (error) {
                // update the status of the post to failed 
                await updatePublishedPost(post._id, null, 'failed', error);
                console.error('Error occurred while publishing scheduled posts:', error);
              }
            
            }
        } else {
            console.log('No scheduled posts to publish');
        }
  } catch (error) {
    console.error('Error occurred while publishing scheduled posts:', error);
  }
});

// const newJob = schedule.scheduleJob('*/30 * * * * *', async function() {
//   try {
//     createPost()
//   } catch (error) {
//     console.error('Error occurred while publishing scheduled posts:', error);
//   }
// });

// console.log('Scheduler started. Current time:', new Date());
