// everything that is not related to Express we are gonna do it outside of the app.js file
const mongoose = require('mongoose');
// environment variables are outside the scope of Express
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// we can simply use this dotenv variable, called config on it and then in there we just have to pass an object to specify the path where our configuration file is located.
// what this command will now do is to read our variables from the file and save them into node JS environment variables
dotenv.config({ path: './config.env' });
const app = require('./app');

// environment variables are global variables that are used to define the environment in which a node app is running
// console.log(app.get('env')); // on with environment we are currently in (Express)
// console.log(process.env); // (node)

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
); // replacing a placeholder string with real password

mongoose.set('strictQuery', false);

async function main() {
  await mongoose.connect(DB);
}
main().then(() => {
  console.log('DB connection successful!');
});

// START SERVER

const port = process.env.PORT || 3000; // work on port 8000 or on port 3000
// To start the server
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
