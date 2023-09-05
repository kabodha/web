import styles from "../styles/index.module.scss";
import Head from "next/head";
import cx from "classnames";
import { pipe } from "fp-ts/lib/function";
import * as RAR from "fp-ts/ReadonlyArray";
import * as O from "fp-ts/Option";
import { Recorder } from "../components/recorder";
import { useRootMachine } from "../hooks/useRootMachine";
import { startRecording, stopRecording } from "../utils/events";
import { useSelector } from "@xstate/react";
import { Shortcuts } from "../components/shortcuts";

export default function Index() {
  const rootMachine = useRootMachine();

  const conversation = useSelector(
    rootMachine,
    (state) => state.context.conversation
  );

  const chatStream = useSelector(
    rootMachine,
    (state) => state.context.chatStream
  );

  const isRecording = useSelector(
    rootMachine,
    (state) => state.context.isRecording
  );

  const isSpeaking = O.isSome(chatStream);

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

  return (
    <div className={styles.page}>
      <Head>
        <title>kabodha</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <Recorder />
      <Shortcuts />

      <div
        className={cx(styles.controls, { [styles.speaking]: isSpeaking })}
        onTouchStart={() => {
          rootMachine.send(startRecording.create({}));
        }}
        onTouchEnd={() => {
          rootMachine.send(stopRecording.create({}));
        }}
      >
        <div
          className={cx(styles.record, {
            [styles.recording]: isRecording,
            [styles.speaking]: isSpeaking,
          })}
          type="button"
          disabled={!isRecording}
        />
        <div className={styles.copy}>
          {isRecording
            ? "Listening"
            : isSpeaking
            ? "Speaking"
            : "Hold spacebar to speak"}
        </div>
      </div>

      {O.isSome(recentUserMessage) && (
        <div
          className={cx(styles.message, {
            [styles.idle]:
              (O.isSome(recentAssistantMessage) && currentTurn === "user") ||
              O.isSome(chatStream),
          })}
        >
          {recentUserMessage.value}
        </div>
      )}

      {O.isSome(recentAssistantMessage) && currentTurn === "user" && (
        <div className={styles.message}>{recentAssistantMessage.value}</div>
      )}
    </div>
  );
}
