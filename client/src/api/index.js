import service from '@/utils/request';

export function index() {
  return service({
    url: '/',
    method: 'get'
  });
}
