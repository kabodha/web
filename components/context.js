import React from "react";

export const AppContext = React.createContext({});

export function AppContextProvider(props) {
  return (
    <AppContext.Provider value={props}>{props.children}</AppContext.Provider>
  );
}
