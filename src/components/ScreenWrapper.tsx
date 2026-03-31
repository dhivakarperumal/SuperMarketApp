import React, { ReactNode } from "react";
import { View, ScrollView, StyleSheet, ViewStyle, StatusBar, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets, Edge } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface ScreenWrapperProps {
  children: ReactNode;
  // Use keyboard aware scroll view for forms
  keyboardAware?: boolean;
  // Use scroll view (without keyboard awareness)
  scrollable?: boolean;
  // Background color
  backgroundColor?: string;
  // SafeArea edges to apply (default: ['top'])
  edges?: Edge[];
  // Additional style for the container
  style?: ViewStyle;
  // Content container style (for scroll views)
  contentContainerStyle?: ViewStyle;
  // Disable SafeAreaView (for modals that handle their own safe area)
  disableSafeArea?: boolean;
  // Show vertical scroll indicator
  showsVerticalScrollIndicator?: boolean;
  // Extra scroll height for keyboard (default: 100)
  extraScrollHeight?: number;
  // Padding at the bottom (useful when there's a bottom bar)
  bottomPadding?: number;
  // Status bar style
  statusBarStyle?: "default" | "light-content" | "dark-content";
}

export function ScreenWrapper({
  children,
  keyboardAware = false,
  scrollable = false,
  backgroundColor = "#F9FAFB",
  edges = ["top"],
  style,
  contentContainerStyle,
  disableSafeArea = false,
  showsVerticalScrollIndicator = false,
  extraScrollHeight = 100,
  bottomPadding,
  statusBarStyle = "dark-content",
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    ...style,
  };

  const contentStyle: ViewStyle = {
    flexGrow: 1,
    paddingBottom: bottomPadding ?? insets.bottom,
    ...contentContainerStyle,
  };

  // Render content based on props
  const renderContent = () => {
    if (keyboardAware) {
      return (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={contentStyle}
          enableOnAndroid={true}
          enableAutomaticScroll={Platform.OS === "ios"}
          extraScrollHeight={extraScrollHeight}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
          {children}
        </KeyboardAwareScrollView>
      );
    }

    if (scrollable) {
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }

    return <View style={containerStyle}>{children}</View>;
  };

  // Set status bar style
  const statusBarBackgroundColor = Platform.OS === "android" ? backgroundColor : undefined;

  if (disableSafeArea) {
    return (
      <>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={statusBarBackgroundColor}
          translucent={Platform.OS === "android"}
        />
        <View style={containerStyle}>{renderContent()}</View>
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
        translucent={Platform.OS === "android"}
      />
      <SafeAreaView style={containerStyle} edges={edges}>
        {keyboardAware || scrollable ? renderContent() : children}
      </SafeAreaView>
    </>
  );
}

// Pre-configured variants for common use cases
export function FormScreen({
  children,
  ...props
}: Omit<ScreenWrapperProps, "keyboardAware">) {
  return (
    <ScreenWrapper keyboardAware={true} {...props}>
      {children}
    </ScreenWrapper>
  );
}

export function ListScreen({
  children,
  ...props
}: Omit<ScreenWrapperProps, "scrollable">) {
  return (
    <ScreenWrapper scrollable={true} {...props}>
      {children}
    </ScreenWrapper>
  );
}

export function StaticScreen({
  children,
  ...props
}: ScreenWrapperProps) {
  return (
    <ScreenWrapper {...props}>
      {children}
    </ScreenWrapper>
  );
}

export default ScreenWrapper;
