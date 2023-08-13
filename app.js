//! 50. Setting up Express and Basic Routing
const path = require('path'); // used to manipulate path names

// It's kind of a convention to have all the Express configuration in app.js.

// Is a function which upon calling will add a bunch of methods to our app variable here
const express = require('express');

// middleware called morgan
const morgan = require('morgan');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug'); // template view engine
app.set('views', path.join(__dirname, 'views')); // allows to create a path joining the directory name /views

//! 60. Using 3rd-Party Middleware (Morgan)
// Very popular logging middleware. So, a middleware that's gonna allow us to see request data right in the console.

//TODO 1) GLOBAL MIDDLEWARES

// Serving static files
// app.use(express.static(`${__dirname}/public`)); // middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
// in browser write 127.0.0.1:3000/overview.html

// CORS policy
app.use(cors());
app.options('*', cors());

// Set security HTTP headers
// app.use(helmet.crossOriginEmbedderPolicy({ policy: 'credentialless' }));

// Further HELMET configuration for Security Policy (CSP)
const defaultSrcUrls = ['https://js.stripe.com/'];

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.4.0/axios.min.js',
  'https://js.stripe.com/v3/',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://*.stripe.com',
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com',
  'http://localhost:8000/api/v1/users/login',
  'http://localhost/api/v1/bookings/checkout-session/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", ...defaultSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      connectSrc: ["'self'", ...connectSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      workerSrc: ["'self'", 'blob:'],
    },
  })
);

// WE use NODE_ENV variable and also the port variable (from config.env connected and saved in server.js). And to do that we go into app.js and somewhere here the port should be defined and somewhere here we have oral logger middleware and what I wanna do now is to only run that middleware so to only define it when we are actually in development, so that the login does not happen when the app is in production.
// Now you might be wondering why we actually have access to this environment variable here when we didn't really define them in this file but in server.js. And the answer to that is that the reading of the variables from the file which happens in server.js (dotenv.config(...)) to the node process only needs to happen once. It's then in the process and the process is of course the same no matter in what file we are. So we're always in the same process and the environment variables are on the process. And so the process that is running, so where our application is running is always the same and so this (process.env.NODE_ENV) is available to us in every single file in the project.
// console.log(process.env.NODE_ENV);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100, // how many requests can be sent by one ip
  windowMs: 60 * 60 * 1000, // 1 hour - 100 requests per 1h
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); //it will affect only our api

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // middleware - a function that can modify the incoming request data
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSql query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//! 59. Creating Our Own Middleware
/*
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});
*/

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);

  next();
});

//! 61. Implementing the "Users" Routes

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//! 62. Creating and Mounting Multiple Routers
//TODO 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // true middleware / sub app
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// * - all http verbs (get, post, patch, delete) and routes / everything
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// error handling middleware
app.use(globalErrorHandler);

module.exports = app;
/////////////////////////////////////////////////////////////////////////

/*
// We're just specifying the kind of root URL here.
// The route is basically the URL, which in this case, is just this root URL ('/') and also the http method, which is get in this case

app.get('/', (req, res) => {
  // res.status(200).send('Hello from the server side!');
  res
    .status(200)
    .json({ message: 'Hello from the server side!', app: 'Natours' }); // passing in a JSON object
});

app.post('/', (req, res) => {
  res.send('You can post to this endpoint...');
});
*/

/*
//! 52. Starting Our API: Handling GET Requests
// callback function here is called a route handler
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours }, // data: { tours: tours }
  });
});

//! 54. Responding to URL Parameters
// :id is a variable
// example with multiple variables: /api/v1/tours/:id/:x/:y - they are required in request
// example with optional variable: /api/v1/tours/:id? - by adding ? at the end of the variable
app.get('/api/v1/tours/:id', (req, res) => {
  // request.params is where all the parameters of all the variables that we define here (/tours/:id <<<') are stored
  console.log(req.params);

  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  // if (id >= tours.length) {
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

//! 53. Handling POST Requests

app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body); // we can access the body of the request thanks to middleware

  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: { tour: newTour },
      });
    }
  );
});

//! 55. Handling PATCH Requests
// Two methods: put and patch
// With put, we expect that our application receives the entire new updated object
// With patch, we only expect the properties that should actually be updated on the object
app.patch('/api/v1/tours/:id', (req, res) => {
  // full process was omitted

  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
});

// ! 56. Handling DELETE Requests

app.delete('/api/v1/tours/:id', (req, res) => {
  // full process was omitted

  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const port = 3000;
// To start the server
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
/////////////////////////////////////////////////////////////////////////////
*/
/*
EXAMPLE OF PATCH TO CHANGE VALUES:
    app.patch('/api/v1/tours/:id', (req, res) => {
      const id = req.params.id * 1;
      const tour = tours.find(tour => tour.id === id);
     
      if (!tour) {
        return res.status(404).send({
          status: 'fail',
          message: 'Invalid ID'
        });
      }
     
      const updatedTour = { ...tour, ...req.body };
      const updatedTours = tours.map(tour =>
        tour.id === updatedTour.id ? updatedTour : tour
      );
     
      fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(updatedTours),
        err => {
          res.status(200).send({
            status: 'success',
            data: updatedTour
          });
        }
      );
    });
*/

/*
EXAMPLE OF delete TO DELETE TOURS:
    app.delete('/api/v1/tours/:id', (req, res) => {
      const id = parseInt(req.params.id);
      const tour = tours.find(t => t.id === id);
     
      if (!tour) {
        return res.status(404).json({
          status: 'fail',
          message: 'Invaild ID'
        });
      }
     
      const updatedTours = tours.filter(t => t.id !== tour.id);
      fs.writeFile(
        path.resolve(__dirname, 'dev-data', 'data', 'tours-simple.json'),
        JSON.stringify(updatedTours),
        err => {
          res.status(204).json({
            status: 'success',
            data: null
          });
        }
      );
    });
*/
