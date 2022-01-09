import service from '@/utils/request';

export function getFileList() {
  return service({
    url: '/file',
    method: 'get'
  });
}
