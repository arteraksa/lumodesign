declare module "@/components/effects/LiquidEther" {
  import type { ComponentType, CSSProperties } from "react";

  type LiquidEtherProps = {
    mouseForce?: number;
    cursorSize?: number;
    isViscous?: boolean;
    viscous?: number;
    iterationsViscous?: number;
    iterationsPoisson?: number;
    dt?: number;
    BFECC?: boolean;
    colors?: string[];
    autoDemo?: boolean;
    autoSpeed?: number;
    autoIntensity?: number;
    takeoverDuration?: number;
    autoResumeDelay?: number;
    autoRampDuration?: number;
    color0?: string;
    color1?: string;
    color2?: string;
    isBounce?: boolean;
    resolution?: number;
    className?: string;
    style?: CSSProperties;
  };

  const LiquidEther: ComponentType<LiquidEtherProps>;
  export default LiquidEther;
}
