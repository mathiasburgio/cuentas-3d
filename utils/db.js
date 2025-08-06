const mongoose = require("mongoose");
require('dotenv').config();
let dbConnection;

async function connectDB(){
	 //'mongodb://127.0.0.1/exampleDB'
	 try{
		if(dbConnection) return dbConnection;

		 dbConnection = await mongoose.connect(process.env.MONGO_URI, {
			 useNewUrlParser: true,
			 useUnifiedTopology: true,
		 })
		 console.log('MongoDB connected successfully');
		 return dbConnection;
		} catch (error) {
		console.error('Error connecting to MongoDB:', error.message);
		process.exit(1);
	}
}

module.exports = connectDB;