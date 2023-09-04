import { useRootMachine } from "../hooks/useRootMachine";
import { useSelector } from "@xstate/react";
import { useEffect } from "react";
import { Readable } from "stream";
import * as O from "fp-ts/Option";
import { sendMessage, setChatStreamContent } from "../utils/events";

export function Writer() {
  const rootMachine = useRootMachine();
  const chatStream = useSelector(
    rootMachine,
    (state) => state.context.chatStream
  );

  useEffect(() => {
    if (O.isSome(chatStream)) {
      let message = "";
      const readable = Readable.from(chatStream.value);

      readable.on("data", (chunk) => {
        message += chunk;
        // rootMachine.send(setChatStreamContent.create({ content: message }));
        console.log(message);
      });

      readable.on("end", () => {
        rootMachine.send(
          sendMessage.create({
            role: "assistant",
            content: message,
          })
        );

        if (readable) {
          readable.destroy();
        }
      });
    }
  });
}
