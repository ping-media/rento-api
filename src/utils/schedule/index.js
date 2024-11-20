const schedule = require('node-schedule');


/**
* @param {String} name
* @param {Function} task
* schedule Cron-style syntax:-
* @param 
* @param {Number} minute (0 - 59)
* @param {Number} hour (0 - 23)
* @param {Number} day of the month (1 - 31)
* @param {Number} month (1 - 12)
* @param {Number} day of the week (0 - 6) 
*/
function createScheduledJob(name, task, scheduleString) {
  const job = schedule.scheduleJob(name, scheduleString, task);
  return job;
}

module.exports = {
  createScheduledJob
}