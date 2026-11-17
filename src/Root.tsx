import React from "react";
import { Composition } from "remotion";
import { BoxePromo, TOTAL_FRAMES } from "./BoxePromo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BoxeAcademiePromo"
      component={BoxePromo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
