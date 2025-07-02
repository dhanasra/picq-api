const depManager = require("../core/depManager");
const responser = require("../core/responser");

async function saveFcm(req, res){
  try{
    const userID = req.userID;
    const { deviceID, fcmToken } = req.body;

    if(deviceID==""){
      return responser.success(res, true, "Success");
    }

    const user = await depManager.USER.getUserModel().updateOne(
      { _id: userID, "fcmTokens.deviceID": deviceID },
      {
        $set: { "fcmTokens.$.fcmToken": fcmToken }
      }
    );

    if (user.matchedCount === 0) {
      await depManager.USER.getUserModel().updateOne(
        { _id: userID },
        {
          $addToSet: {
            fcmTokens: { deviceID, fcmToken } 
          }
        }
      );
    }

    return responser.success(res, true, "Success");
  }catch(e){
    console.log(e)
    return responser.success(res, false, "Failed to update");
  }
}

async function getNotifications(req, res){
  try{

    const { userID } = req;
    const { filterBy, id } = req.query;

    const conditions = filterBy=="all" ? {} : filterBy=="read" ? { isRead: true } : { isRead: false };

    if(id){
      const notifications =  await depManager.NOTIFICATION.getNotificationsModel().aggregate([
        {
          $match: {
            _id: new ObjectId(id),
          }
        },  
        {
          $lookup: {
            from: "NotificationsInfo",
            let: { messageID: { $toObjectId: "$messageID" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$messageID"] } } }
            ],
            as: "message"
          }
        },
        {
          $unwind: "$message"
        },
        {
          $sort: {
            created: -1
          }
        }
      ])
      
      return responser.success(res, notifications[0], "Success");
    }

    const notifications =  await depManager.NOTIFICATIONS.getNotificationsModel().find({ userID, ...conditions })
    return responser.success(res, notifications, "Success");
  }catch(e){
    console.log(e)
    return responser.success(res, false, "Failed to get");
  }
}

async function getNotificationDetails(req, res){
  try{
    const { id } = req.params;
    const notification =  await depManager.NOTIFICATIONS.getNotificationsModel().findById(id)
    return responser.success(res, notification, "Success");
  }catch(e){
    console.log(e)
    return responser.success(res, false, "Failed to get");
  }
}


async function updateRead(req, res){
  try{
    const { isRead } = req.query;
    const { id } = req.params;

    await depManager.NOTIFICATIONS.getNotificationsModel().updateOne({_id: id}, { isRead: isRead ?? true })
    return responser.success(res, true, "Success");
  }catch(e){
    console.log(e)
    return responser.success(res, false, "Failed to get");
  }
}

async function deleteNotification(req, res){
  try{
    const { userID } = req;
    const { id } = req.params;

    if(id){
      await depManager.NOTIFICATIONS.getNotificationsModel().deleteOne({
        _id: id
      });
    }else{
      await depManager.NOTIFICATIONS.getNotificationsModel().deleteMany({ userID });
    }

    return responser.success(res, true, "Success");
  }catch(e){
    console.log(e)
    return responser.success(res, false, "Failed to get");
  }
}

module.exports = {
    saveFcm,
    updateRead,
    getNotifications,
    getNotificationDetails,
    deleteNotification
}