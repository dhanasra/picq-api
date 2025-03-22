const { default: axios } = require("axios");

module.exports.isStatusCode = (statusCode) => {
  return /^-?\d+$/.test(statusCode) && statusCode >= 100 && statusCode < 600;
};


const makeid = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports.makeid = makeid;

module.exports.getYYYYMMDDHHMM = () => {
  var x = new Date();
  var y = x.getFullYear().toString();
  var m = (x.getMonth() + 1).toString();
  var d = x.getDate().toString();
  var hours = x.getHours().toString();
  var minutes = x.getMinutes().toString();

  d.length == 1 && (d = "0" + d);
  m.length == 1 && (m = "0" + m);
  hours.length == 1 && (hours = "0" + hours);
  minutes.length == 1 && (minutes = "0" + minutes);

  var yyyymmddhhmm = y + m + d + hours + minutes;
  return yyyymmddhhmm;
};

module.exports.getDDMMYYYY = (currentDate = new Date(), seperator = "-") => {
  var month = currentDate.getMonth() + 1;
  if (month < 10) month = "0" + month;
  var dateOfMonth = currentDate.getDate();
  if (dateOfMonth < 10) dateOfMonth = "0" + dateOfMonth;
  var year = currentDate.getFullYear();
  var formattedDate = dateOfMonth + seperator + month + seperator + year;
  return formattedDate;
};

module.exports.uploadFile = async (folderName, file) => {
  try{
    let _uploadFolder = folderName;
    let extension, fileData, mimeType;
  
    if (typeof file === 'string') {
      // Handle image URL
      const response = await axios.get(file, { responseType: 'arraybuffer' });
      fileData = response.data;
      mimeType = response.headers['content-type'];
  
      extension = mimeType.split('/')[1]; // Get extension from MIME type
    } else {
      // Handle file upload
      extension = file.name.substr(file.name.lastIndexOf(".") + 1);
      fileData = file.data;
      mimeType = file.mimetype;
    }
  
    const newName = `${_uploadFolder}${makeid(30)}.${extension}`;
    const _fileUrl = await uploadObjectToS3Bucket(newName, mimeType, fileData);
    const file_url = _fileUrl.substring(0, _fileUrl.indexOf("?"));
  
    return file_url;
  }catch(e){
    console.log(e)
    return null;
  }
};

const uploadObjectToS3Bucket = async (
  objectName,
  mimeType,
  objectData
) => {
  try{
    const aws = require("aws-sdk");
    const BUCKET_NAME = process.env.S3_BUCKET_NAME;

    console.log(BUCKET_NAME);
    console.log(objectName);
    console.log(objectData);
    console.log(mimeType);

    const params = {
      Bucket: BUCKET_NAME,
      Key: objectName,
      Body: objectData,
      ContentType: mimeType,
    };
    const s3 = new aws.S3({});
    const _result = await s3.putObject(params).promise();
    const _params = { Bucket: BUCKET_NAME, Key: objectName };
    const url = s3.getSignedUrl("getObject", _params);
    return url;
  }catch(e){
    console.log(e)
    return null;
  }
};

module.exports.uploadObjectToS3Bucket = uploadObjectToS3Bucket;