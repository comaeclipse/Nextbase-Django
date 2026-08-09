"use client";

import { useRef } from "react";

/**
 * Second throwaway fixture for the ci-fix smoke test's escalation path:
 * a fresh react-hooks/refs violation, introduced after ci-fix's first
 * automatic fix, to confirm it does NOT auto-fix a second consecutive
 * failure and instead escalates to status:blocked.
 */
export function BrokenRefComponentTwo({ value }: { value: string }) {
  const ref = useRef(value);
  ref.current = value;

  return <div>{ref.current}</div>;
}
