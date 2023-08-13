/* eslint-disable */
// import axios from 'axios';
import { showAlert } from './alerts.js';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51Nct4lKQaMvT0W6wHyZFngklgKvmwUSXC3Xn23UNwkqwUbZDJRoY1IKQmvkf9qM4susLH8vSwP56Gud2PXrvGDTi00ixwLc7dn'
  );
  try {
    // 1) Get checkout session from the API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};
