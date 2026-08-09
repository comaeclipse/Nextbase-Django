"use client";

import { useEffect, useRef } from "react";

/**
 * Throwaway fixture for testing the ci-fix bot. Previously violated
 * react-hooks/refs (wrote ref.current during render) so CI failed on lint.
 * Safe to delete once the ci-fix smoke test is done.
 */
export function BrokenRefComponent({ value }: { value: string }) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return <div>{value}</div>;
}
