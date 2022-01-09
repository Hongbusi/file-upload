import service from '@/utils/request';

export function index() {
  return service({
    url: '/',
    method: 'get'
  });
}

export function file() {
  return service({
    url: '/file',
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

export function upload(data, { onUploadProgress }) {
  return service({
    url: '/upload',
    method: 'post',
    data,
    onUploadProgress
  });
}

export function merge(data) {
  return service({
    url: '/merge',
    method: 'post',
    data
  });
}
