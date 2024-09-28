/* eslint-disable import/prefer-default-export */
export function safeCb(cb) {
  if (typeof cb === 'function') {
    return cb;
  }
  return () => {};
}
