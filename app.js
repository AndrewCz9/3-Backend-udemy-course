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
const compression = require('compression');

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

// Very popular logging middleware. So, a middleware that's gonna allow us to see request data right in the console.

//TODO 1) GLOBAL MIDDLEWARES

// Serving static files
// app.use(express.static(`${__dirname}/public`)); // middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// CORS policy
app.use(cors());
app.options('*', cors());

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

// compress all the text that is sent to clients
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);

  next();
});

//TODO 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // true middleware / sub app
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// error handling middleware
app.use(globalErrorHandler);

module.exports = app;
