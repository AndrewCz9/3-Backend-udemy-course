/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const slugify = require('slugify');

// (Mongoose) Model is like a blueprint that we use to create a document (like classes in JS). Also we use it to query update and delete these documents. And to create a model we need a schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // validator
      unique: true,
      trim: true, // removes all the white space in the beginning and in the end of the string
      // only for strings
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // only for strings
      enum: {
        values: ['easy', 'medium', 'difficult'], // an array of values that are allowed
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // for nums and dates
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // name of the image (reference to the image)
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // an array of strings
    createdAt: {
      type: Date,
      default: Date.now,
      select: false, // allows to hide the createdAt from the output (res)
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // Embedded documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    // options
    toJSON: { virtuals: true }, // each time that the data is  actually outputted as JSON, we want virtuals to be true. basically the virtuals to be part of the output.
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // earth-like sphere

// Virtual properties
tourSchema.virtual('durationWeeks').get(function () {
  // if we want to use this keyword we need to use regular function
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE (mongoose): runs before .save() and .create()
tourSchema.pre('save', function (next) {
  // this - points to the currently processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE (mongoose): runs functions before or after a certain query is executed
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   console.log(docs);
//   next();
// });

// AGGREGATION MIDDLEWARE (mongoose):

// Q&A
tourSchema.pre('aggregate', function (next) {
  if (!this.pipeline()[0].$geoNear)
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this);
  next();
});

// creating a tour model from schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
