const dbManager = require("./dbManager");
const UserSchema = require('../models/CoreUser/User');
const AdminSchema = require('../models/CoreUser/Admin');
const { MongoClient } = require('mongodb');
// const uri = "mongodb://localhost:27017/";
const uri = process.env.MONGO_URI;

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB Connected");
//   } catch (err) {
//     console.error(err.message);
//     process.exit(1);
//   }
// };

exports.getUserSpecificConnection = async (userId) => {
  const client = new MongoClient(uri);
  await client.connect();
  const dbList = await client.db().admin().listDatabases();
  const dbNames = dbList.databases
    .filter(db => db.name !== 'admin' && db.name !== 'local' && db.name !== 'config')
    .map(db => db.name);

  // Search for the user in all school databases to find their admin association
  for (const dbName of dbNames) {
    const connection = await dbManager.getConnection(dbName);
    const UserModel = connection.model('User', UserSchema);
    const AdminModel = connection.model('Admin', AdminSchema);

    const user = await UserModel.findById(userId);
    if (user) {
      // Found the user, now get the admin info to confirm the database
      const admin = await AdminModel.findOne();
      if (admin) {
        await client.close();
        return {
          connection,
          userId: user._id,
          adminId: admin._id,
          schoolName: admin.schoolName,
          dbName
        };
      }
    }
  }

  await client.close();
  throw new Error('User not found in any database');
};

// module.exports = connectDB;
