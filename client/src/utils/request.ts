import axios from 'axios';

const service = axios.create({
  baseURL: '/api'
});

service.interceptors.response.use(
  response => {
    const { data } = response;
    return data;
  }
);

export default service;
