import { fireEvent } from '@testing-library/react-native';
export const usePressableDriver = driver => {
  const press = () => {
    fireEvent.press(driver.getElement());
  };
  const hasOnPress = () => {
    return typeof driver.getElement().props.onPress === 'function';
  };
  const onPressIn = () => {
    fireEvent(driver.getElement(), 'onPressIn');
  };
  const hasOnPressIn = () => {
    return typeof driver.getElement().props.onPressIn === 'function';
  };
  const onPressOut = () => {
    fireEvent(driver.getElement(), 'onPresonPressOutsIn');
  };
  const hasOnPressOut = () => {
    return typeof driver.getElement().props.onPressOut === 'function';
  };
  const onLongPress = () => {
    fireEvent(driver.getElement(), 'onLongPress');
  };
  const hasOnLongPress = () => {
    return typeof driver.getElement().props.onLongPress === 'function';
  };
  return {
    ...driver,
    press,
    hasOnPress,
    onPressIn,
    hasOnPressIn,
    onPressOut,
    hasOnPressOut,
    onLongPress,
    hasOnLongPress
  };
};