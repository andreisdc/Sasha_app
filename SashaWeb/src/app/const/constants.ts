export const SERVER = {
  BASE_URL: 'http://localhost:5043',

  // ================================
  // 1️⃣ AUTH ENDPOINTS
  // ================================
  AUTH_PATH: '/auth',
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // ================================
  // 2️⃣ USER ENDPOINTS
  // ================================
  USER_PATH: '/user',
  GET_USER: '/user',
  UPDATE_USER: '/user/update',
  DELETE_USER: '/user/delete',

  // ================================
  // 3️⃣ PROPERTIES ENDPOINTS
  // ================================
  PROPERTIES_PATH: '/properties',
  GET_PROPERTIES: '/properties',
  GET_PROPERTY: '/properties/', // + id
  ADD_PROPERTY: '/properties/add',
  UPDATE_PROPERTY: '/properties/update',
  DELETE_PROPERTY: '/properties/delete',

  // ================================
  // 4️⃣ PROPERTY PHOTOS ENDPOINTS
  // ================================
  PROPERTY_PHOTOS_PATH: '/property-photos',
  ADD_PROPERTY_PHOTO: '/property-photos/add',
  DELETE_PROPERTY_PHOTO: '/property-photos/delete/', // + id
  GET_PROPERTY_PHOTOS: '/property-photos/property/', // + propertyId

  // ================================
  // 5️⃣ AMENITIES ENDPOINTS
  // ================================
  AMENITIES_PATH: '/amenities',
  GET_AMENITIES: '/amenities',
  ADD_AMENITY: '/amenities/add',
  UPDATE_AMENITY: '/amenities/update',
  DELETE_AMENITY: '/amenities/delete/', // + id

  // ================================
  // 6️⃣ PROPERTY AMENITIES ENDPOINTS
  // ================================
  PROPERTY_AMENITIES_PATH: '/property-amenities',
  ADD_PROPERTY_AMENITY: '/property-amenities/add',
  DELETE_PROPERTY_AMENITY: '/property-amenities/delete/', // + id
  GET_PROPERTY_AMENITIES: '/property-amenities/property/', // + propertyId

  // ================================
  // 7️⃣ ACTIVITIES ENDPOINTS
  // ================================
  ACTIVITIES_PATH: '/activities',
  GET_ACTIVITIES: '/activities',
  ADD_ACTIVITY: '/activities/add',
  UPDATE_ACTIVITY: '/activities/update',
  DELETE_ACTIVITY: '/activities/delete/', // + id

  // ================================
  // 8️⃣ PROPERTY ACTIVITIES ENDPOINTS
  // ================================
  PROPERTY_ACTIVITIES_PATH: '/property-activities',
  ADD_PROPERTY_ACTIVITY: '/property-activities/add',
  DELETE_PROPERTY_ACTIVITY: '/property-activities/delete/', // + id
  GET_PROPERTY_ACTIVITIES: '/property-activities/property/', // + propertyId

  // ================================
  // 9️⃣ BOOKINGS ENDPOINTS
  // ================================
  BOOKINGS_PATH: '/bookings',
  GET_BOOKINGS: '/bookings',
  GET_BOOKINGS_FOR_USER: '/bookings/user/', // + userId
  ADD_BOOKING: '/bookings/add',
  UPDATE_BOOKING: '/bookings/update',
  DELETE_BOOKING: '/bookings/delete/', // + id

  // ================================
  // 🔟 REVIEWS ENDPOINTS
  // ================================
  REVIEWS_PATH: '/reviews',
  GET_REVIEWS: '/reviews',
  GET_REVIEWS_FOR_PROPERTY: '/reviews/property/', // + propertyId
  ADD_REVIEW: '/reviews/add',
  UPDATE_REVIEW: '/reviews/update',
  DELETE_REVIEW: '/reviews/delete/', // + id

  // ================================
  // 1️⃣1️⃣ NOTIFICATIONS ENDPOINTS
  // ================================
  NOTIFICATIONS_PATH: '/notifications',
  GET_NOTIFICATIONS: '/notifications',
  ADD_NOTIFICATION: '/notifications/add',
  UPDATE_NOTIFICATION: '/notifications/update',
  DELETE_NOTIFICATION: '/notifications/delete/', // + id
  MARK_AS_READ: '/notifications/read',

  // ================================
  // 1️⃣2️⃣ QR CHECK-IN ENDPOINTS
  // ================================
  QR_CHECKIN_PATH: '/qr-checkin',
  ADD_QR_CHECKIN: '/qr-checkin/add',
  UPDATE_QR_CHECKIN: '/qr-checkin/update',
  DELETE_QR_CHECKIN: '/qr-checkin/delete/', // + id

  // ================================
  // 1️⃣3️⃣ USER HISTORY ENDPOINTS
  // ================================
  USER_HISTORY_PATH: '/user-history',
  ADD_USER_HISTORY: '/user-history/add',
  DELETE_USER_HISTORY: '/user-history/delete/', // + id
  GET_USER_HISTORY: '/user-history/user/', // + userId

  // ================================
  // 1️⃣4️⃣ PENDING APPROVE ENDPOINTS
  // ================================
  PENDING_APPROVE_PATH: '/pending-approve',
  ADD_PENDING_APPROVE: '/pending-approve/add',
  GET_ALL_PENDING_APPROVALS: '/pending-approve/all',
  DELETE_PENDING_APPROVE: '/pending-approve/', // + id
  UPDATE_PENDING_APPROVE_STATUS: '/pending-approve/update-status/', // + id

  // ================================
  // 1️⃣5️⃣ ADMIN ENDPOINTS
  // ================================
  ADMIN_PATH: '/admin',
  ADMIN_VERIFICATIONS: '/admin/verifications',
  ADMIN_APPROVE_VERIFICATION: '/admin/approve-verification/', // + userId
  ADMIN_REJECT_VERIFICATION: '/admin/reject-verification/', // + userId

  // ================================
  // 1️⃣6️⃣ SELLER/HOST ENDPOINTS
  // ================================
  SELLER_PATH: '/seller',
  APPLY_FOR_VERIFICATION: '/seller/apply-verification',
  GET_SELLER_PROFILE: '/seller/profile',
  UPDATE_SELLER_PROFILE: '/seller/update',

  // ================================
  // 1️⃣7️⃣ FILE UPLOAD ENDPOINTS
  // ================================
  UPLOAD_PATH: '/upload',
  UPLOAD_PROFILE_PICTURE: '/upload/profile-picture',
  UPLOAD_PROPERTY_PHOTOS: '/upload/property-photos',
  UPLOAD_VERIFICATION_DOCS: '/upload/verification-docs'
};