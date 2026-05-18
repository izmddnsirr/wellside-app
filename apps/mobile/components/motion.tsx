"use client";

import {
  createContext,
  useContext,
  useRef,
  type PropsWithChildren,
} from "react";
import type { ViewProps } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  LinearTransition,
  ZoomIn,
} from "react-native-reanimated";

const easeOut = Easing.bezier(0.25, 0.1, 0.25, 1);
const easeSpring = Easing.bezier(0.34, 1.26, 0.64, 1);
const easeSpringPop = Easing.bezier(0.34, 1.56, 0.64, 1);

const DELAY_CHILDREN = 100;
const STAGGER_CHILDREN = 70;

type StaggerContextValue = {
  next: () => number;
};

const StaggerContext = createContext<StaggerContextValue | null>(null);

type MotionViewProps = PropsWithChildren<
  ViewProps & {
    delay?: number;
    variant?: "fade" | "up";
  }
>;

type StaggerItemProps = PropsWithChildren<
  ViewProps & {
    delay?: number;
    index?: number;
  }
>;

export function MotionView({
  children,
  delay = 0,
  variant = "up",
  ...props
}: MotionViewProps) {
  const entering =
    variant === "fade"
      ? FadeIn.delay(delay).duration(300).easing(easeOut)
      : FadeInUp.delay(delay).duration(300).easing(easeOut);

  return (
    <Animated.View
      entering={entering}
      layout={LinearTransition.duration(220)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

export function BookingPageTransition({
  children,
  ...props
}: PropsWithChildren<ViewProps>) {
  return (
    <Animated.View
      entering={FadeInUp.duration(350).easing(easeOut)}
      layout={LinearTransition.duration(220)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

export function BookingStaggerList({
  children,
  ...props
}: PropsWithChildren<ViewProps>) {
  const counterRef = useRef(0);

  const context: StaggerContextValue = {
    next: () => {
      const index = counterRef.current;
      counterRef.current += 1;
      return DELAY_CHILDREN + index * STAGGER_CHILDREN;
    },
  };

  return (
    <StaggerContext.Provider value={context}>
      <Animated.View {...props}>{children}</Animated.View>
    </StaggerContext.Provider>
  );
}

export function BookingStaggerItem({
  children,
  delay,
  index,
  ...props
}: StaggerItemProps) {
  const stagger = useContext(StaggerContext);
  const resolvedDelayRef = useRef<number | null>(null);

  if (resolvedDelayRef.current === null) {
    if (delay !== undefined) {
      resolvedDelayRef.current = delay;
    } else if (stagger) {
      resolvedDelayRef.current = stagger.next();
    } else {
      resolvedDelayRef.current = DELAY_CHILDREN + (index ?? 0) * STAGGER_CHILDREN;
    }
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(resolvedDelayRef.current)
        .duration(300)
        .easing(easeOut)}
      layout={LinearTransition.duration(220)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

export function BookingConfirmedCard({
  children,
  delay = 0,
  ...props
}: StaggerItemProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(450).easing(easeSpring)}
      layout={LinearTransition.duration(220)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

export function BookingConfirmedIcon({
  children,
  delay = 300,
  ...props
}: StaggerItemProps) {
  return (
    <Animated.View
      entering={ZoomIn.delay(delay).duration(400).easing(easeSpringPop)}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
