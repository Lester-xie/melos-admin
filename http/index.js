import axios from 'axios';

axios.defaults.adapter = require('axios/lib/adapters/http');

axios.defaults.baseURL = 'https://www.metaapp.fun/api/v1/';
let token = '';
const $http = axios.create({
  headers: {
    'Content-Type': 'application/json',
  }
});

$http.interceptors.request.use(
  async (request) => {
    try {
      request.headers['Authorization'] = token;
    } catch (error) {
      console.warn(error);
    }
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

$http.interceptors.response.use(
  ({ data }) => {
    if (data.code === 0) {
      return data.data
    }
    return data;
  },
  (error) => {
    if (
      error.response &&
      (error.response.status === 404 || error.response.status >= 500)
    ) {
      console.error('系统出错，请联系管理员')
    } else if (error.response.status === 401) {
      // document.location.href = '/login'
    }
    throw new Error(error.response.data.error);
  }
);

const updateToken = newToken => (token = newToken);
export { $http, updateToken };
