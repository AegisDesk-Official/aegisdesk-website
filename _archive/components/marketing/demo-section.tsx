'use client';

import { VerificationWorkbench } from "./verification-workbench";

export function DemoSection({ demoEnabled = true }: { demoEnabled?: boolean }) {
  return <VerificationWorkbench demoEnabled={demoEnabled} />;
}

export default DemoSection;
