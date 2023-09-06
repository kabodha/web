import { motion } from "framer-motion";
import styles from "../styles/index.module.scss";
import { useRootMachine } from "../hooks/useRootMachine";
import { useSelector } from "@xstate/react";
import { pipe } from "fp-ts/lib/function";
import * as RAR from "fp-ts/ReadonlyArray";
import * as O from "fp-ts/Option";
import cx from "classnames";
import { concatMap } from "rxjs";
import { useEffect, useState, useMemo } from "react";

export function Messages() {
  const rootMachine = useRootMachine();

  const conversation = useSelector(
    rootMachine,
    (state) => state.context.conversation
  );

  const recentUserMessage = pipe(
    conversation,
    RAR.findLast((message) => message.role === "user"),
    O.map((message) => message.content)
  );

  const recentAssistantMessage = pipe(
    conversation,
    RAR.findLast((message) => message.role === "assistant"),
    O.map((message) => message.content)
  );

  const currentTurn = pipe(
    conversation,
    RAR.last,
    O.map((message) => (message.role === "user" ? "assistant" : "user")),
    O.getOrElse(() => "user")
  );

  const socket = useSelector(rootMachine, (state) => state.context.socket);

  const [meta, setMeta] = useState([]);

  const durationToWord = useMemo(() => {
    const words = [];
    let lastWord = "";

    meta.forEach(({ char, duration }) => {
      if (char === " ") {
        words.push({
          word: lastWord,
          duration,
        });

        lastWord = "";
      } else {
        lastWord += char;
      }
    });

    return words;
  }, [meta]);

  useEffect(() => {
    let subscription;

    if (socket) {
      subscription = socket
        .pipe(
          concatMap((data) => {
            const { normalizedAlignment } = data;

            if (normalizedAlignment) {
              const { chars, charStartTimesMs } = normalizedAlignment;

              setMeta((prev) => {
                const max = prev.reduce(
                  (max, item) => Math.max(max, item.duration),
                  0
                );

                return [
                  ...prev,
                  ...chars.map((char, index) => ({
                    char,
                    duration: charStartTimesMs[index] + max,
                  })),
                ];
              });
            }

            return [];
          })
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [socket]);

  return (
    <div className={styles.messages}>
      {O.isSome(recentUserMessage) && (
        <div
          className={cx(styles.message, {
            [styles.idle]: meta.length > 0,
          })}
        >
          {recentUserMessage.value.split(" ").map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              className={styles.word}
              initial={{ display: "none" }}
              animate={{ display: "flex" }}
              transition={{
                delay: 0.05 * index,
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      )}

      {O.isSome(recentAssistantMessage) && currentTurn === "user" ? (
        <div className={styles.message}>
          {durationToWord
            .filter(({ word }) => word.length > 0)
            .map(({ word, duration }, index) => (
              <motion.span
                key={`${word}-${index}`}
                className={styles.word}
                initial={{ display: "none" }}
                animate={{ display: "flex" }}
                transition={{
                  delay: duration / 1000,
                }}
              >
                {word}
              </motion.span>
            ))}
        </div>
      ) : (
        <div className={styles.message} />
      )}
    </div>
  );
}
