import mongoose from "mongodb";
const connectionString = process.env.ATLAS_URI as string;

const client = new mongoose.MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as mongoose.ConnectOptions);
 
let dbConnection: mongoose.Db;

export const connectToServer = (callback: (err?: mongoose.AnyError) => void) => {
    client.connect((err, db) => {
      if (err || !db) {
        return callback(err);
      }
 
      dbConnection = db.db("sample_airbnb");
      console.log("Successfully connected to MongoDB.");
 
      return callback();
    });
  };
 
export const getDb = () => {
    return dbConnection;
};