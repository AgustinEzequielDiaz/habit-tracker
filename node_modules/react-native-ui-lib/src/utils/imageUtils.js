import get from 'lodash/get';
import Assets from "../assets";
export function isSvgUri(source) {
  // @ts-expect-error
  return typeof source === 'object' && source?.uri?.endsWith?.('.svg');
}
export function isSvg(source) {
  return typeof source === 'function' || isSvgUri(source) || isSvgData(source);
}
export function isBase64ImageContent(data) {
  const base64Content = data.split(',')[1];
  const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  return base64regex.test(base64Content);
}
export function getAsset(assetName = '', assetGroup = '') {
  return get(Assets, `${assetGroup}.${assetName}`);
}
function isSvgData(source) {
  if (typeof source === 'string') {
    const sourceString = source;
    return sourceString.includes('</svg>') || sourceString.includes('data:image/svg');
  }
}