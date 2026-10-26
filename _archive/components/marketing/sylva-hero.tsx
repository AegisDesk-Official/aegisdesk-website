'use client';

import React from "react";
import { Hero, HeroProps } from "./hero";

export type SylvaHeroProps = HeroProps;

export function SylvaHero(props: SylvaHeroProps) {
  return <Hero {...props} />;
}

export default SylvaHero;
