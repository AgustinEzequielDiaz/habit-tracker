import React, { PureComponent } from 'react';
import { ImageSourcePropType, ImageStyle, StyleProp, TextStyle, TouchableOpacityProps, ViewStyle, ViewProps } from 'react-native';
declare const LABEL_FORMATTER_VALUES: readonly [1, 2, 3, 4];
type LabelFormatterValues = typeof LABEL_FORMATTER_VALUES[number];
export type BadgeProps = ViewProps & TouchableOpacityProps & {
    /**
     * Text to show inside the badge.
     * Not passing a label (undefined) will present a pimple badge.
     */
    label?: string;
    /**
     * Color of the badge background
     */
    backgroundColor?: string;
    /**
     * the badge size
     */
    size?: number;
    /**
     * Press handler
     */
    onPress?: (props: any) => void;
    /**
     * Defines how far a touch event can start away from the badge.
     */
    hitSlop?: ViewProps['hitSlop'];
    /**
     * width of border around the badge
     */
    borderWidth?: number;
    /**
     * radius of border around the badge
     */
    borderRadius?: number;
    /**
     * color of border around the badge
     */
    borderColor?: ImageStyle['borderColor'];
    /**
     * Additional styles for the top container
     */
    containerStyle?: StyleProp<ViewStyle>;
    /**
     * Additional styles for the badge label
     */
    labelStyle?: StyleProp<TextStyle>;
    /**
     * Receives a number from 1 to 4, representing the label's max digit length.
     * Beyond the max number for that digit length, a "+" will show at the end.
     * If set to a value not included in LABEL_FORMATTER_VALUES, no formatting will occur.
     * Example: labelLengthFormater={2}, label={124}, label will present "99+".
     */
    labelFormatterLimit?: LabelFormatterValues;
    /**
     * Renders an icon badge
     */
    icon?: ImageSourcePropType;
    /**
     * Additional styling to badge icon
     */
    iconStyle?: object;
    /**
     * Additional props passed to icon
     */
    iconProps?: object;
    /**
     * Custom element to render instead of an icon
     */
    customElement?: JSX.Element;
    key?: string | number;
};
/**
 * @description: Round colored badge, typically used to show a number
 * @extends: View
 * @image: https://user-images.githubusercontent.com/33805983/34480753-df7a868a-efb6-11e7-9072-80f5c110a4f3.png
 * @example: https://github.com/wix/react-native-ui-lib/blob/master/demo/src/screens/componentScreens/BadgesScreen.tsx
 */
declare class Badge extends PureComponent<BadgeProps> {
    static displayName: string;
    styles: ReturnType<typeof createStyles>;
    constructor(props: BadgeProps);
    getAccessibilityProps(): {
        accessible: boolean;
        accessibilityRole: string;
        accessibilityLabel: string;
    };
    get size(): number;
    isSmallBadge(): boolean;
    getBadgeSizeStyle(): any;
    getFormattedLabel(): any;
    getBorderStyling(): ViewStyle;
    renderLabel(): React.JSX.Element | undefined;
    renderCustomElement(): JSX.Element | undefined;
    renderIcon(): 0 | React.JSX.Element | undefined;
    render(): React.JSX.Element;
}
declare function createStyles(props: BadgeProps): {
    badge: {
        alignSelf: "flex-start";
        borderRadius: number;
        backgroundColor: string | undefined;
        alignItems: "center";
        justifyContent: "center";
        overflow: "hidden";
    };
    label: {
        color: string;
        backgroundColor: string;
        fontFamily?: string | undefined;
        fontSize?: number | undefined;
        fontStyle?: "normal" | "italic" | undefined;
        fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | undefined;
        letterSpacing?: number | undefined;
        lineHeight?: number | undefined;
        textAlign?: "auto" | "left" | "right" | "center" | "justify" | undefined;
        textDecorationLine?: "none" | "underline" | "line-through" | "underline line-through" | undefined;
        textDecorationStyle?: "solid" | "double" | "dotted" | "dashed" | undefined;
        textDecorationColor?: import("react-native").ColorValue | undefined;
        textShadowColor?: import("react-native").ColorValue | undefined;
        textShadowOffset?: {
            width: number;
            height: number;
        } | undefined;
        textShadowRadius?: number | undefined;
        textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | undefined;
        userSelect?: "auto" | "none" | "text" | "contain" | "all" | undefined;
        fontVariant?: import("react-native").FontVariant[] | undefined;
        writingDirection?: "auto" | "ltr" | "rtl" | undefined;
        backfaceVisibility?: "visible" | "hidden" | undefined;
        borderBlockColor?: import("react-native").ColorValue | undefined;
        borderBlockEndColor?: import("react-native").ColorValue | undefined;
        borderBlockStartColor?: import("react-native").ColorValue | undefined;
        borderBottomColor?: import("react-native").ColorValue | undefined;
        borderBottomEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderBottomLeftRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderBottomRightRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderBottomStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderColor?: import("react-native").ColorValue | undefined;
        borderCurve?: "circular" | "continuous" | undefined;
        borderEndColor?: import("react-native").ColorValue | undefined;
        borderEndEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderEndStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderLeftColor?: import("react-native").ColorValue | undefined;
        borderRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderRightColor?: import("react-native").ColorValue | undefined;
        borderStartColor?: import("react-native").ColorValue | undefined;
        borderStartEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderStartStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderStyle?: "solid" | "dotted" | "dashed" | undefined;
        borderTopColor?: import("react-native").ColorValue | undefined;
        borderTopEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderTopLeftRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderTopRightRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderTopStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        opacity?: import("react-native").AnimatableNumericValue | undefined;
        elevation?: number | undefined;
        pointerEvents?: "auto" | "none" | "box-none" | "box-only" | undefined;
        alignContent?: "center" | "flex-start" | "flex-end" | "stretch" | "space-between" | "space-around" | undefined;
        alignItems?: import("react-native").FlexAlignType | undefined;
        alignSelf?: "auto" | import("react-native").FlexAlignType | undefined;
        aspectRatio?: string | number | undefined;
        borderBottomWidth?: number | undefined;
        borderEndWidth?: number | undefined;
        borderLeftWidth?: number | undefined;
        borderRightWidth?: number | undefined;
        borderStartWidth?: number | undefined;
        borderTopWidth?: number | undefined;
        borderWidth?: number | undefined;
        bottom?: import("react-native").DimensionValue | undefined;
        display?: "none" | "flex" | undefined;
        end?: import("react-native").DimensionValue | undefined;
        flex?: number | undefined;
        flexBasis?: import("react-native").DimensionValue | undefined;
        flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
        rowGap?: number | undefined;
        gap?: number | undefined;
        columnGap?: number | undefined;
        flexGrow?: number | undefined;
        flexShrink?: number | undefined;
        flexWrap?: "wrap" | "nowrap" | "wrap-reverse" | undefined;
        height?: import("react-native").DimensionValue | undefined;
        justifyContent?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
        left?: import("react-native").DimensionValue | undefined;
        margin?: import("react-native").DimensionValue | undefined;
        marginBottom?: import("react-native").DimensionValue | undefined;
        marginEnd?: import("react-native").DimensionValue | undefined;
        marginHorizontal?: import("react-native").DimensionValue | undefined;
        marginLeft?: import("react-native").DimensionValue | undefined;
        marginRight?: import("react-native").DimensionValue | undefined;
        marginStart?: import("react-native").DimensionValue | undefined;
        marginTop?: import("react-native").DimensionValue | undefined;
        marginVertical?: import("react-native").DimensionValue | undefined;
        maxHeight?: import("react-native").DimensionValue | undefined;
        maxWidth?: import("react-native").DimensionValue | undefined;
        minHeight?: import("react-native").DimensionValue | undefined;
        minWidth?: import("react-native").DimensionValue | undefined;
        overflow?: "visible" | "hidden" | "scroll" | undefined;
        padding?: import("react-native").DimensionValue | undefined;
        paddingBottom?: import("react-native").DimensionValue | undefined;
        paddingEnd?: import("react-native").DimensionValue | undefined;
        paddingHorizontal?: import("react-native").DimensionValue | undefined;
        paddingLeft?: import("react-native").DimensionValue | undefined;
        paddingRight?: import("react-native").DimensionValue | undefined;
        paddingStart?: import("react-native").DimensionValue | undefined;
        paddingTop?: import("react-native").DimensionValue | undefined;
        paddingVertical?: import("react-native").DimensionValue | undefined;
        position?: "absolute" | "relative" | undefined;
        right?: import("react-native").DimensionValue | undefined;
        start?: import("react-native").DimensionValue | undefined;
        top?: import("react-native").DimensionValue | undefined;
        width?: import("react-native").DimensionValue | undefined;
        zIndex?: number | undefined;
        direction?: "ltr" | "rtl" | "inherit" | undefined;
        shadowColor?: import("react-native").ColorValue | undefined;
        shadowOffset?: Readonly<{
            width: number;
            height: number;
        }> | undefined;
        shadowOpacity?: import("react-native").AnimatableNumericValue | undefined;
        shadowRadius?: number | undefined;
        transform?: string | (({
            perspective: import("react-native").AnimatableNumericValue;
        } & {
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotate: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotateX: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotateY: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotateZ: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            scale: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            scaleX: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            scaleY: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            translateX: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            translateY: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            skewX: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            skewY: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            matrix?: undefined;
        }) | ({
            matrix: import("react-native").AnimatableNumericValue[];
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
        }))[] | undefined;
        transformOrigin?: string | (string | number)[] | undefined;
        transformMatrix?: number[] | undefined;
        rotation?: import("react-native").AnimatableNumericValue | undefined;
        scaleX?: import("react-native").AnimatableNumericValue | undefined;
        scaleY?: import("react-native").AnimatableNumericValue | undefined;
        translateX?: import("react-native").AnimatableNumericValue | undefined;
        translateY?: import("react-native").AnimatableNumericValue | undefined;
        textAlignVertical?: "auto" | "center" | "top" | "bottom" | undefined;
        verticalAlign?: "auto" | "top" | "bottom" | "middle" | undefined;
        includeFontPadding?: boolean | undefined;
    };
    labelSmall: {
        lineHeight: undefined;
        color?: import("react-native").ColorValue | undefined;
        fontFamily?: string | undefined;
        fontSize?: number | undefined;
        fontStyle?: "normal" | "italic" | undefined;
        fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | undefined;
        letterSpacing?: number | undefined;
        textAlign?: "auto" | "left" | "right" | "center" | "justify" | undefined;
        textDecorationLine?: "none" | "underline" | "line-through" | "underline line-through" | undefined;
        textDecorationStyle?: "solid" | "double" | "dotted" | "dashed" | undefined;
        textDecorationColor?: import("react-native").ColorValue | undefined;
        textShadowColor?: import("react-native").ColorValue | undefined;
        textShadowOffset?: {
            width: number;
            height: number;
        } | undefined;
        textShadowRadius?: number | undefined;
        textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | undefined;
        userSelect?: "auto" | "none" | "text" | "contain" | "all" | undefined;
        fontVariant?: import("react-native").FontVariant[] | undefined;
        writingDirection?: "auto" | "ltr" | "rtl" | undefined;
        backfaceVisibility?: "visible" | "hidden" | undefined;
        backgroundColor?: import("react-native").ColorValue | undefined;
        borderBlockColor?: import("react-native").ColorValue | undefined;
        borderBlockEndColor?: import("react-native").ColorValue | undefined;
        borderBlockStartColor?: import("react-native").ColorValue | undefined;
        borderBottomColor?: import("react-native").ColorValue | undefined;
        borderBottomEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderBottomLeftRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderBottomRightRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderBottomStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderColor?: import("react-native").ColorValue | undefined;
        borderCurve?: "circular" | "continuous" | undefined;
        borderEndColor?: import("react-native").ColorValue | undefined;
        borderEndEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderEndStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderLeftColor?: import("react-native").ColorValue | undefined;
        borderRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderRightColor?: import("react-native").ColorValue | undefined;
        borderStartColor?: import("react-native").ColorValue | undefined;
        borderStartEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderStartStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderStyle?: "solid" | "dotted" | "dashed" | undefined;
        borderTopColor?: import("react-native").ColorValue | undefined;
        borderTopEndRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderTopLeftRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderTopRightRadius?: import("react-native").AnimatableNumericValue | undefined;
        borderTopStartRadius?: import("react-native").AnimatableNumericValue | undefined;
        opacity?: import("react-native").AnimatableNumericValue | undefined;
        elevation?: number | undefined;
        pointerEvents?: "auto" | "none" | "box-none" | "box-only" | undefined;
        alignContent?: "center" | "flex-start" | "flex-end" | "stretch" | "space-between" | "space-around" | undefined;
        alignItems?: import("react-native").FlexAlignType | undefined;
        alignSelf?: "auto" | import("react-native").FlexAlignType | undefined;
        aspectRatio?: string | number | undefined;
        borderBottomWidth?: number | undefined;
        borderEndWidth?: number | undefined;
        borderLeftWidth?: number | undefined;
        borderRightWidth?: number | undefined;
        borderStartWidth?: number | undefined;
        borderTopWidth?: number | undefined;
        borderWidth?: number | undefined;
        bottom?: import("react-native").DimensionValue | undefined;
        display?: "none" | "flex" | undefined;
        end?: import("react-native").DimensionValue | undefined;
        flex?: number | undefined;
        flexBasis?: import("react-native").DimensionValue | undefined;
        flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
        rowGap?: number | undefined;
        gap?: number | undefined;
        columnGap?: number | undefined;
        flexGrow?: number | undefined;
        flexShrink?: number | undefined;
        flexWrap?: "wrap" | "nowrap" | "wrap-reverse" | undefined;
        height?: import("react-native").DimensionValue | undefined;
        justifyContent?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
        left?: import("react-native").DimensionValue | undefined;
        margin?: import("react-native").DimensionValue | undefined;
        marginBottom?: import("react-native").DimensionValue | undefined;
        marginEnd?: import("react-native").DimensionValue | undefined;
        marginHorizontal?: import("react-native").DimensionValue | undefined;
        marginLeft?: import("react-native").DimensionValue | undefined;
        marginRight?: import("react-native").DimensionValue | undefined;
        marginStart?: import("react-native").DimensionValue | undefined;
        marginTop?: import("react-native").DimensionValue | undefined;
        marginVertical?: import("react-native").DimensionValue | undefined;
        maxHeight?: import("react-native").DimensionValue | undefined;
        maxWidth?: import("react-native").DimensionValue | undefined;
        minHeight?: import("react-native").DimensionValue | undefined;
        minWidth?: import("react-native").DimensionValue | undefined;
        overflow?: "visible" | "hidden" | "scroll" | undefined;
        padding?: import("react-native").DimensionValue | undefined;
        paddingBottom?: import("react-native").DimensionValue | undefined;
        paddingEnd?: import("react-native").DimensionValue | undefined;
        paddingHorizontal?: import("react-native").DimensionValue | undefined;
        paddingLeft?: import("react-native").DimensionValue | undefined;
        paddingRight?: import("react-native").DimensionValue | undefined;
        paddingStart?: import("react-native").DimensionValue | undefined;
        paddingTop?: import("react-native").DimensionValue | undefined;
        paddingVertical?: import("react-native").DimensionValue | undefined;
        position?: "absolute" | "relative" | undefined;
        right?: import("react-native").DimensionValue | undefined;
        start?: import("react-native").DimensionValue | undefined;
        top?: import("react-native").DimensionValue | undefined;
        width?: import("react-native").DimensionValue | undefined;
        zIndex?: number | undefined;
        direction?: "ltr" | "rtl" | "inherit" | undefined;
        shadowColor?: import("react-native").ColorValue | undefined;
        shadowOffset?: Readonly<{
            width: number;
            height: number;
        }> | undefined;
        shadowOpacity?: import("react-native").AnimatableNumericValue | undefined;
        shadowRadius?: number | undefined;
        transform?: string | (({
            perspective: import("react-native").AnimatableNumericValue;
        } & {
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotate: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotateX: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotateY: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            rotateZ: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            scale: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            scaleX: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            scaleY: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            translateX: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            translateY: import("react-native").AnimatableNumericValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            skewX?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            skewX: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewY?: undefined;
            matrix?: undefined;
        }) | ({
            skewY: import("react-native").AnimatableStringValue;
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            matrix?: undefined;
        }) | ({
            matrix: import("react-native").AnimatableNumericValue[];
        } & {
            perspective?: undefined;
            rotate?: undefined;
            rotateX?: undefined;
            rotateY?: undefined;
            rotateZ?: undefined;
            scale?: undefined;
            scaleX?: undefined;
            scaleY?: undefined;
            translateX?: undefined;
            translateY?: undefined;
            skewX?: undefined;
            skewY?: undefined;
        }))[] | undefined;
        transformOrigin?: string | (string | number)[] | undefined;
        transformMatrix?: number[] | undefined;
        rotation?: import("react-native").AnimatableNumericValue | undefined;
        scaleX?: import("react-native").AnimatableNumericValue | undefined;
        scaleY?: import("react-native").AnimatableNumericValue | undefined;
        translateX?: import("react-native").AnimatableNumericValue | undefined;
        translateY?: import("react-native").AnimatableNumericValue | undefined;
        textAlignVertical?: "auto" | "center" | "top" | "bottom" | undefined;
        verticalAlign?: "auto" | "top" | "bottom" | "middle" | undefined;
        includeFontPadding?: boolean | undefined;
    };
};
export { Badge };
declare const _default: React.ForwardRefExoticComponent<ViewProps & TouchableOpacityProps & {
    /**
     * Text to show inside the badge.
     * Not passing a label (undefined) will present a pimple badge.
     */
    label?: string | undefined;
    /**
     * Color of the badge background
     */
    backgroundColor?: string | undefined;
    /**
     * the badge size
     */
    size?: number | undefined;
    /**
     * Press handler
     */
    onPress?: ((props: any) => void) | undefined;
    /**
     * Defines how far a touch event can start away from the badge.
     */
    hitSlop?: import("react-native").Insets | undefined;
    /**
     * width of border around the badge
     */
    borderWidth?: number | undefined;
    /**
     * radius of border around the badge
     */
    borderRadius?: number | undefined;
    /**
     * color of border around the badge
     */
    borderColor?: import("react-native").ColorValue | undefined;
    /**
     * Additional styles for the top container
     */
    containerStyle?: StyleProp<ViewStyle>;
    /**
     * Additional styles for the badge label
     */
    labelStyle?: StyleProp<TextStyle>;
    /**
     * Receives a number from 1 to 4, representing the label's max digit length.
     * Beyond the max number for that digit length, a "+" will show at the end.
     * If set to a value not included in LABEL_FORMATTER_VALUES, no formatting will occur.
     * Example: labelLengthFormater={2}, label={124}, label will present "99+".
     */
    labelFormatterLimit?: 1 | 3 | 2 | 4 | undefined;
    /**
     * Renders an icon badge
     */
    icon?: ImageSourcePropType | undefined;
    /**
     * Additional styling to badge icon
     */
    iconStyle?: object | undefined;
    /**
     * Additional props passed to icon
     */
    iconProps?: object | undefined;
    /**
     * Custom element to render instead of an icon
     */
    customElement?: JSX.Element | undefined;
    key?: string | number | undefined;
} & React.RefAttributes<any>> & typeof Badge;
export default _default;
