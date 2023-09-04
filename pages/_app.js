import "../styles/globals.scss";
import { AppContextProvider } from "../components/context";
import { useInterpret } from "@xstate/react";
import { RootMachine } from "../machines/root";

function MyApp({ Component, pageProps }) {
  const rootMachine = useInterpret(RootMachine);

  return (
    <AppContextProvider {...{ rootMachine }}>
      <Component {...pageProps} />
    </AppContextProvider>
  );
}

export default MyApp;
