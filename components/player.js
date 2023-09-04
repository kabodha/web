import { useSelector } from "@xstate/react";
import { useRootMachine } from "../hooks/useRootMachine";
import { useEffect } from "react";
import { endAudioStream, isSpeaking } from "../utils/events";
import * as O from "fp-ts/Option";

export function Player() {
  const rootMachine = useRootMachine();

  const audioStream = useSelector(
    rootMachine,
    (state) => state.context.audioStream
  );

  useEffect(() => {
    if (O.isSome(audioStream)) {
      const reader = audioStream.value.body.getReader();
      let chunks = [];

      reader.read().then(function process({ done, value }) {
        if (done) {
          const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
          const audioUrl = window.URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audio.play();
          audio.onplay = () => {
            rootMachine.send(isSpeaking.create({ value: true }));
          };
          audio.onended = () => {
            rootMachine.send(isSpeaking.create({ value: false }));
          };

          rootMachine.send(endAudioStream.create());

          return;
        }

        chunks.push(value);
        return reader.read().then(process);
      });
    }
  });
}
