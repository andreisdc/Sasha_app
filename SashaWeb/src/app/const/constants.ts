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
  UPDATE_USER: '/auth/update',

  // ================================
  // 2️⃣ PENDING APPROVE ENDPOINTS
  // ================================
  PENDING_APPROVE_PATH: '/api/pendingapprove',
  PENDING_APPROVE_PATH_PROPERTIES: '/properties',
  GET_ALL_PENDING_APPROVALS: '/api/pendingapprove',
  GET_PENDING_APPROVE_BY_ID: '/api/pendingapprove/', // + id
  ADD_PENDING_APPROVE: '/api/pendingapprove',
  UPDATE_PENDING_APPROVE: '/api/pendingapprove/', // + id
  DELETE_PENDING_APPROVE: '/api/pendingapprove/', // + id
  APPROVE_PENDING: '/api/pendingapprove/', // + id + /approve
  REJECT_PENDING: '/api/pendingapprove/' // + id + /reject
};