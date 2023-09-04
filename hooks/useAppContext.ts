import React from "react";

import { AppContext } from "../components/context";

// @ts-ignore
export function useAppContext(): AppContext {
  return React.useContext(AppContext);
}
