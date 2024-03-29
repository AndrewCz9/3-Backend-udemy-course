const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user.id; // req.user.id is from protect
  next();
};

exports.getAllReviews = factory.getAll(Review, {
  paramName: 'tourId',
  foreignField: 'tour',
});
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

exports.isOwner = factory.isOwner(Review, 'user');
