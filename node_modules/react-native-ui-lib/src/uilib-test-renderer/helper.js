import { StyleSheet } from 'react-native';
const findStyle = (key, component) => {
  const style = component?.props?.style;
  if (style) {
    return StyleSheet.flatten(style)[key];
  }
  return style;
};
export { findStyle };