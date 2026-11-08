"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False in the server HTML and during hydration, true once the client has taken over. Controls stay disabled
// until their handlers exist (SPEC R01), without a mount effect or a second render pass.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
