const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
// const { populate } = require('../models/reviewModel');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

/*
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc },
    });
  });
*/

// https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065540#questions/16813340

const getCollectionName = (Model) => Model.collection.collectionName;

const getFilterObj = ({ paramName, foreignField }, req) => {
  const pName = req.params?.[paramName];
  return pName ? { [foreignField]: pName } : {};
};

exports.getAll = (Model, options) =>
  catchAsync(async (req, res) => {
    let filterObj = {};

    if (typeof options === 'object' && Object.keys(options).length) {
      filterObj = getFilterObj(options, req);
    }

    const apiFeatures = new APIFeatures(Model.find(filterObj), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await apiFeatures.query.explain().exec();
    const docs = await apiFeatures.query.exec();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { [getCollectionName(Model)]: docs },
    });
  });

exports.isOwner = (Model, idField) =>
  catchAsync(async (req, _, next) => {
    const doc = await Model.findById(req.params.id).exec();

    if (req.user.id !== doc[idField].id) {
      next(new AppError('Unauthorized', 403));
      return;
    }

    next();
  });
