const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// mix of images (different names)
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image) - single image - req.file
// upload.array('images', 5) - multiple of the same name - req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

/*
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);
*/
/*
exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is: ${val}`);

  if (req.params.id * 1 >= tours.length) {
    // we have this return statement here, because if we didn't have this return here, well, then express would send this response back but it would still continue running the code in this function. And so after sending the response, it will then still hit this next function and it would move on to the next middleware and will then send another response to the client. But that is really not allowed. Just make sure that after sending this response, the function will return so that it will finish and it will never call this next
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  next();
};
*/
/*
exports.checkBody = (req, res, next) => {
  console.log(req.body);
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};
*/
//TODO 2) ROUTE HANDLERS
// middleware (next because this in not the last middleware, it allows to end this middleware and then turn on the next middleware)
exports.aliasTopTours = (req, res, next) => {
  // we prefilling the query string
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

// catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const tours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: { tours },
// });
/*
  try {
    // console.log(req.requestTime);

    //* BUILD QUERY
    // 1) Filtering
    
    const queryObj = { ...req.query }; // shallow copy of req.query object
    const excludedFields = ['page', 'sort', 'limit', 'fields']; // an array of all the fields that we want to exclude
    excludedFields.forEach((el) => delete queryObj[el]); // deleting excluded fields
    
    // console.log(req.query, queryObj); // all parameters that are passed into a request (an object with the data froom the query string - request_url/tours?duration=5&difficulty=easy)

    // 1# way to filter the query - find method
    // const query = Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // });

    // 2# way to filter the query - chaining special mongoose methods
    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // 2) Advanced filtering
    
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));

    // { difficulty: 'easy', duration: { $gte:5 }}
    // { difficulty: 'easy', duration: { gte: '5' } }
    // gte, gt, lte, lt

    let query = Tour.find(JSON.parse(queryStr)); //returns a query - the result is a filtered documents from DB
    
    
    // 3) Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      // console.log(sortBy);
      query = query.sort(sortBy);
      // sort('price ratingsAverage') <- in mongoose
    } else {
      // aorting by not unique (createdAt) and unique (id) field (unique field is neccesary for sort to work correctly)
      query = query.sort('-createdAt _id');
    }
    
    
    // 4) Field limiting (projecting)
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v'); // excluding fields that we dont want to sent to the client (example __v)
    }
    
    
    // 5) Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2&limit=10, 1-10 page 1, 11-20, page 2, 21-30, page 3
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      // eslint-disable-next-line no-throw-literal
      if (skip >= numTours) throw 'This page does not exist';
    }
    

    //* EXECUTE QUERY
    // We are creating a new object of the API features class
    // In there we are parsing a query object (Tour.find()) and the query string that's coming from express (req.query)
    // Then, in each of these four methods that we call one after another, we manipulate the query
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // By the end we await the result so that it can come back with all the documents that were selected
    // that query lives at features.query
    const tours = await features.query; // returns a promise that we need to await
    // query.sort().select().skip().limit()

    //* SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
  */
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: { tour },
//   });

/*
  try {
    // const id = req.params.id * 1;
    // const tour = tours.find((el) => el.id === id);
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({ _id: req.params.id })

    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
  */
// });

exports.createTour = factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: { tour: newTour },
//   });

/*
  try {
    // 'ok' way
    
      const newTour = new Tour({})
      newTour.save();
    
    // better way - it alse returns a promise
    
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { tour: newTour },
    });
    
    
    const newId = tours[tours.length - 1].id + 1;
    const newTour = Object.assign({ id: newId }, req.body);
    tours.push(newTour);
    fs.writeFile(
      `${__dirname}/../dev-data/data/tours-simple.json`,
      JSON.stringify(tours),
      () => {
        res.status(201).json({
          status: 'success',
          data: { tour: newTour },
        });
    }
    );
    
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
*/
// });

exports.updateTour = factory.updateOne(Tour);

/*
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
*/
/*
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // the new updated document will be the one that will be returned
      runValidators: true, //tells the validators in the schema to run again
    });

    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }

});
*/

exports.deleteTour = factory.deleteOne(Tour);

/*
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
  */

/*
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
  
});
*/
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });

  /*
  try {
    const stats = await Tour.aggregate([
      // stages
      {
        // select or filter certain documents
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        // allows to group documents together using accumulators
        $group: {
          _id: { $toUpper: '$difficulty' }, // to uppercase
          // _id: null, // everything in one group
          // _id: '$difficulty', // groups based on difficulty
          numTours: { $sum: 1 }, // num of tours - 1 for each document
          numRating: { $sum: '$ratingsQuantity' }, // num of rating
          avgRating: { $avg: '$ratingsAverage' }, // calc avr rating
          avgPrice: { $avg: '$price' }, // calc avr price
          minPrice: { $min: '$price' }, // calc min price
          maxPrice: { $max: '$price' }, // calc max price
        },
      },
      {
        // we need to use the field names that we specified in the group
        $sort: { avgPrice: 1 }, // 1 - ascending
      },
      // {
      //   // we can repeat stages (this example: match multiple times)
      //   // selecting the documents that are not EASY
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
  */
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStats: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStats: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });

  /*
  try {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStats: { $sum: 1 },
          tours: { $push: '$name' }, // tworzy array z nazwami tour
        },
      },
      {
        $addFields: { month: '$_id' }, // adds a new field called month with value from _id
      },
      {
        $project: {
          _id: 0, // id will not show up in res, for 1 it would be shown
        },
      },
      {
        $sort: { numTourStats: -1 }, // -1 descending, 1 ascending
      },
      {
        $limit: 12, // res will show only 12 docs
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: { plan },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
  */
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tour-within/233/center/-40,45/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      }, // need to be the first stage
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { data: distances },
  });
});
