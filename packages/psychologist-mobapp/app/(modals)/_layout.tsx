import { Stack } from "expo-router";

/**
 * Modal stack — каждый screen открывается как iOS formSheet (UIModalPresentationFormSheet)
 * или Android BottomSheetBehavior. Drag-to-dismiss работает нативно.
 */
export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "formSheet",
        headerShown: false,
        sheetAllowedDetents: [0.5, 0.95],
        sheetGrabberVisible: true,
        sheetCornerRadius: 24,
      }}
    />
  );
}
