const coreDB = require("./db");
const responser = require("./responser");

// module.exports = function (service) {
//     console.log("service==>", service)
//     return async function (req, res, next) {
//         const db = await coreDB.openDBConnnection();
//         try {
//             await service(req, res, next);
//         } catch (error) {
//             console.log(error);
//             responser.error(res, error);
//         } finally {
//             await coreDB.closeDBConnnection(db);
//         }
//     };
// };

module.exports = function (service) {
  return async function (req, res, next) {
    const db = await coreDB.openDBConnnection();
    
    try {
      if (typeof service !== "function") {
        console.error("Error: Provided service is not a function");
        throw new Error("Provided service is not a function");
      }
      await service(req, res, next);
    } catch (error) {
      console.error(error);
      responser.error(res, error);
    } finally {
      // await coreDB.closeDBConnnection(db);
    }
  };
};
