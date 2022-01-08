import service from '@/utils/request';

export function index(data) {
  return request({
    url: '/',
    method: 'get'
  });
}
