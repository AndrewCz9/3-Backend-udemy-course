const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router(); // middleware function

//  middleware that only runs when 'id' is present in the URL
// router.param('id', tourController.checkID);

/*
router.param('id', (req, res, next, val) => {
  console.log(`Tour id is: ${val}`);
  next();
});
*/

// nested routes
// POST /tour/234f5d8/reviews
// GET /tour/234f5d8/reviews

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tour-within?distance=233&center=-40,45&unit=im - użytkownik musiałby tak podać dane (dotychczasowa metoda)
// /tour-within/233/center/-40,45/unit/mi - wykożystana w tym przypadku metoda

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// route handlers
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  ); // chaining middlewares, 1st to run is checkBody, 2nd createTour
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
