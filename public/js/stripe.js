/* eslint-disable */
import { showAlert } from './alerts.js';

export const bookTour = async (tourId) => {
  const stripe = Stripe(process.env.STRIPE_TEST_KEY);
  try {
    // 1) Get checkout session from the API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};
