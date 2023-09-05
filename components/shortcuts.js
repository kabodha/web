import Mousetrap from "mousetrap";
import { useEffectOnce } from "react-use";
import { useRootMachine } from "../hooks/useRootMachine";
import { startRecording, stopRecording } from "../utils/events";

export function Shortcuts() {
  const rootMachine = useRootMachine();

  useEffectOnce(() => {
    Mousetrap.bind(
      "space",
      () => {
        rootMachine.send(startRecording.create());
      },
      "keydown"
    );

    Mousetrap.bind(
      "space",
      () => {
        rootMachine.send(stopRecording.create());
      },
      "keyup"
    );
  });
}
