import React, { ReactNode } from "react";
import { Platform, StyleSheet, ViewStyle, Keyboard, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface KeyboardAwareScrollViewProps {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  showsVerticalScrollIndicator?: boolean;
  bounces?: boolean;
  dismissKeyboardOnTap?: boolean;
}

export const KeyboardAwareScrollView: React.FC<KeyboardAwareScrollViewProps> = ({
  children,
  style,
  contentContainerStyle,
  extraScrollHeight = 80,
  enableOnAndroid = true,
  showsVerticalScrollIndicator = false,
  bounces = true,
  dismissKeyboardOnTap = true,
}) => {
  const scrollView = (
    <RNKeyboardAwareScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      extraScrollHeight={extraScrollHeight}
      extraHeight={Platform.OS === "ios" ? 120 : 80}
      enableOnAndroid={enableOnAndroid}
      enableAutomaticScroll={true}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      bounces={bounces}
      keyboardOpeningTime={0}
    >
      {children}
    </RNKeyboardAwareScrollView>
  );

  if (dismissKeyboardOnTap) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>{scrollView}</View>
      </TouchableWithoutFeedback>
    );
  }

  return scrollView;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
});

export default KeyboardAwareScrollView;
