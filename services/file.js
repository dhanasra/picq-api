const responser = require("../core/responser");
const { uploadFile } = require("../core/utils");

async function uploadBatch(req, res) {
  try {
    const { userID } = req;

    const images = req?.files?.images;
    let uploaded = [];
    if (Array.isArray(images)) {
      uploaded = await Promise.all(
        images.map(async (pictureFile) => {
          return await uploadFile(`${userID}/picture/`, pictureFile);
        })
      );
    }else if(images){
      uploaded = [ await uploadFile(`${userID}/picture/`, images) ];
    }
    return responser.success(res, uploaded, "STUDIO_S001");
  } catch (error) {
    console.error("Error creating studio:", error);
    return responser.error(res, null, "R001");
  }
}

async function upload(req, res) {
  try {
    const { userID } = req;

    const image = req?.files?.image;

    const uploaded = await uploadFile(`${userID}/picture/`, image);

    return responser.success(res, uploaded, "STUDIO_S001");
  } catch (error) {
    console.error("Error creating studio:", error);
    return responser.error(res, null, "R001");
  }
}

module.exports = {
  uploadBatch,
  upload
};