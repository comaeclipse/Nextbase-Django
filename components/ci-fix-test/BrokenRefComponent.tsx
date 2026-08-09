"use client";

import { useRef } from "react";

/**
 * Throwaway fixture for testing the ci-fix bot. Deliberately violates
 * react-hooks/refs (writes ref.current during render) so CI fails on lint.
 * Safe to delete once the ci-fix smoke test is done.
 */
export function BrokenRefComponent({ value }: { value: string }) {
  const ref = useRef(value);
  ref.current = value;

  return <div>{ref.current}</div>;
}
