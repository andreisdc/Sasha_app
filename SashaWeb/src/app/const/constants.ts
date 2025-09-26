export const SERVER = {
  BASE_URL: 'http://localhost:5043',

  // Auth endpoints
  AUTH_PATH: '/auth',
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // User endpoints (de exemplu pentru alte operațiuni)
  USER_PATH: '/user',
  GET_USER: '/user',           // eventual GET /user/:id
  UPDATE_USER: '/user/update', // dacă implementezi update
  DELETE_USER: '/user/delete', // dacă implementezi delete

  // Properties endpoints (dacă vrei să le folosești pe frontend)
  PROPERTIES_PATH: '/properties',
  GET_PROPERTIES: '/properties',
  GET_PROPERTY: '/properties/', // + id
  ADD_PROPERTY: '/properties/add',
  UPDATE_PROPERTY: '/properties/update',
  DELETE_PROPERTY: '/properties/delete',

  // Bookings endpoints
  BOOKINGS_PATH: '/bookings',
  GET_BOOKINGS: '/bookings',
  ADD_BOOKING: '/bookings/add',
  CANCEL_BOOKING: '/bookings/cancel',

  // Reviews endpoints
  REVIEWS_PATH: '/reviews',
  GET_REVIEWS: '/reviews',
  ADD_REVIEW: '/reviews/add',

  // Notifications
  NOTIFICATIONS_PATH: '/notifications',
  GET_NOTIFICATIONS: '/notifications',
  MARK_AS_READ: '/notifications/read'
};
