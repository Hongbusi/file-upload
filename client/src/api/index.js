import service from '@/utils/request';

export function index() {
  return service({
    url: '/',
    method: 'get'
  });
}

export function check(data) {
  return service({
    url: '/check',
    method: 'post',
    data
  });
}

export function upload(data) {
  return service({
    url: '/upload',
    method: 'post',
    data
  });
}
