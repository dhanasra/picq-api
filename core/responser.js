const messageCode = require("../error-code");
const { isStatusCode } = require("./utils");

let cacheAPIHolder = {};
const getCachedAPIData = (apiName) => {
  if (cacheAPIHolder[apiName]) {
    return cacheAPIHolder[apiName];
  }
  return null;
};

const setCachedAPIData = (apiName, data) => {
  cacheAPIHolder[apiName] = data;
};

module.exports.useCache = async (req, res, next) => {
  try {
    const cache = getCachedAPIData(req.originalUrl);
    if (cache) {
      res.status(200).send(cache);
    } else {
      next();
    }
  } catch (error) {
    next();
  }
};

const getMessage = (handler, locale, code) => {
  return messageCode[handler][locale][code];
};

const successResponse = (
  handler,
  messageCode,
  req,
  data,
  message,
  cache,
  extras,
  success
) => {
  let responseData = {
    status: "success",
    message: message ?? getMessage(handler, req.headers.locale || "en", messageCode),
    messageCode,
    // success,
    data,
  };
  if (Array.isArray(data)) responseData.totals = { count: data.length };
  if (extras) {
    if (Array.isArray(extras))
      throw new Error("Extra data needs to be a non array object");
    if (typeof extras == "object") {
      responseData = { ...responseData, ...extras };
    }
  }
  if (cache) setCachedAPIData(req.originalUrl, responseData);
  return responseData;
};

const errorResponse = (handler, messageCode, req, error) => {
  const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  const notificationData = {
    userAgent: req.get("User-Agent"),
    url: fullUrl,
    method: req.method,
    errorName: error.name || undefined,
    errorMessage: error.message || undefined,
    errorStack: error.stack,
    platform: process.env.PLATFORM,
    environment: process.env.S3_IMAGE_PATH,
  };
  if (req.method.toUpperCase() == "GET") {
    notificationData.request = {
      query: req.query,
      params: req.params,
    };
  } else {
    notificationData.request = req.body
      ? typeof req.body == "object"
        ? req.body
        : JSON.parse(req.body)
      : {};
  }

  // More logging if error isOperational
  if (error.isOperational) {
    notificationData.statusCode = error.statusCode;
    notificationData.handler = error.handler;
    notificationData.messageCode = error.messageCode;
    notificationData.optionalMessage = error.optionalMessage;
    notificationData.status = error.status;
    notificationData.message = messageCode
      ? getMessage(handler, req.headers.locale || "en", messageCode)
      : "Unknown Error";
  }

  // Logging Error Notification to console
  // Response Data for the client request
  let response = {
    status: "error",
    // message: messageCode ? getMessage(handler, req.headers.locale || "en", messageCode) : "Unknown Error",
    message: notificationData.errorMessage,
    messageCode,
    // data: {
    //   errorName: notificationData.errorName,
    //   errorMessage: notificationData.errorMessage
    // }
  };
  if (error.isOperational) {
    // If mergeOptional is true, then merge translated error Message and Optional Parameters
    if (error.mergeOptional) {
      response.message = response.message + " : " + error.optionalMessage;
    } else {
      response.errorDetails = error.optionalMessage;
    }
  }
  // If message is dynamic (for refund message) in error response for Maxis
  if (error.dynamicMessage) {
    response.message = error.dynamicMessage;
    response.errorDetails = error.data;
  }
  return response;
};

module.exports.send = async (
  statusCode,
  handler,
  messageCode,
  req,
  res,
  data,
  message,
  cache = false,
  extras = null,
  success = true
) => {
  let responseData;
  statusCode = isStatusCode(statusCode) ? statusCode : 400;
  if (`${statusCode}`.startsWith("2"))
    responseData = successResponse(
      handler,
      messageCode,
      req,
      data,
      message,
      cache,
      extras,
      success
    );
  if (`${statusCode}`.startsWith("4") || `${statusCode}`.startsWith("5")) {
    responseData = errorResponse(handler, messageCode, req, data);
    if (responseData?.data?.errorName === 'ValidationError') {
      statusCode = 422;
    }
  }
  // await api_request_logs(req, statusCode, responseData);
  res.status(statusCode).send(responseData);

};

module.exports.globalErrorHandler = (req, res, err) => {
  this.error(res, 'GLOBAL_E001', 400);
};

/**
 * @bharath-instrive
 */

const generateResponse = (code) => {
  if (typeof code != 'string') return null;
  const codeParts = code.split("_");
  if (codeParts.length != 2) return null;
  const handler = codeParts[0];
  const codekey = codeParts[1];
  const en = "en";
  try {
    const msg = messageCode[handler][en][codekey];
    return msg;
  } catch (error) {
    return null;
  }
}

module.exports.success = (res, data, messageCode) => {
  const msg = generateResponse(messageCode);

  res.status(200).send({
    "status": "success",
    "data": data,
    "message": msg || messageCode,
    "messageCode": messageCode,
  });
}

module.exports.error = (res, errorCode, status = 400) => {
  console.log(errorCode);
  status = isStatusCode(status) ? status : 400;
  const msg = generateResponse(errorCode);

  res.status(status).send({
    "status": "error",
    "message": msg != null ? msg : errorCode,
    "messageCode": errorCode,
  });
}
