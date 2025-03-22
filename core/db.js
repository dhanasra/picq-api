const mongoose = require("mongoose");

let conn = null;

const _DBException = (message) => {
  this.message = message;
  this.name = "DBException";
};

module.exports.openDBConnnection = async () => {
  try {
    const dbUrl = process.env.MONGO_DB_URL;
    if (!dbUrl) {
      throw new _DBException("DB connection string not valid");
    }
    console.log("mongoose connection", mongoose.connection.readyState);
    if (!mongoose.connection.readyState) {
      console.log("Opening new Connection");
      conn = await mongoose.connect(dbUrl, {
        // useCreateIndex: true,
        // useNewUrlParser: true,
        // useUnifiedTopology: true
      });
      return conn;
    } else {
      console.log("Reusing the existing DB connection.");
      return conn;
    }
  } catch (error) {
    console.log("Error connecting to the database:", error);
    console.log(error);
    return null;
  }
};

module.exports.closeDBConnnection = async (db) => {
  try {
    if (conn) {
      console.log("Closing the DB connection.");
      await mongoose.disconnect();
      conn = null;
    } else {
      console.log("No connection to close.");
    }
  } catch (error) {
    console.log("Error closing the connection:", error);
  }
};
