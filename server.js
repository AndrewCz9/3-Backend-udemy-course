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
  // .then((conn) => {
  //   console.log('conn', conn.connections);
  // });
}
main().then(() => {
  console.log('DB connection successful!');
});
/*
  .catch((err) => console.log(err));
*/
//TODO 4) START SERVER

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

/*
So now the request-response path will be as follow:

Request sent to server
     -> server.js
          -> app.js (res and req object go through all the middlewares)
               -> routes (depends on the path, handled by respective router - userRoutes/tourRoutes)
                    -> controllers (depend on which HTTP method, handled by respective controllers - userControllers/tourControllers)
                         -> END of the request-response flow
*/

/*
We use nodemon server.js to start the process. But if you want to set an environment variable for this process, we need to pre-plan that variable to this command.
In terminal:
* for windows: 
* -* in CMD: SET NODE_ENV=development& nodemon server.js
* ---* multiple variables: set NODE_ENV=development&&SET X=23& nodemon server.js
* -* in Powershell: SET NODE_ENV=development;nodemon server.js
* -* in GIT BASH: NODE_ENV=development nodemon server.js
* ---* multiple variables: NODE_ENV=development X=23 nodemon server.js
* --* in package.json script: SET NODE_ENV=production& nodemon server.js

* ----- look for the universal solution for all platforms

* for linux and mac 
* -* any terminal: NODE_ENV=development nodemon server.js 
* ---* Multiple variables: NODE_ENV=development X=23 nodemon server.js
*/

/*
// new document
const testTour = new Tour({
  name: 'The Park Camper',
  price: 997,
});

// saving the document to DB, it returns a promise
testTour
  .save()
  .then((doc) => {
    console.log(doc);
  })
  .catch((err) => {
    console.log('ERROR 💥:', err);
  });
*/
