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
import { Player } from "../components/player";
import { useKey } from "react-use";

export default function Index() {
  const rootMachine = useRootMachine();

  const conversation = useSelector(
    rootMachine,
    (state) => state.context.conversation
  );

  const isRecording = useSelector(
    rootMachine,
    (state) => state.context.isRecording
  );

  const isSpeaking = useSelector(
    rootMachine,
    (state) => state.context.isSpeaking
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

  return (
    <div className={styles.page}>
      <Head>
        <title>kabodha</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <Recorder />
      <Player />

      <div
        className={cx(styles.controls, { [styles.speaking]: isSpeaking })}
        onPointerDown={() => {
          rootMachine.send(startRecording.create({}));
        }}
        onPointerUp={() => {
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
        <div className={cx(styles.copy, { [styles.speaking]: isSpeaking })}>
          {isRecording
            ? "Listening"
            : isSpeaking
            ? "Speaking"
            : "Hold to speak"}
        </div>
      </div>

      {O.isSome(recentUserMessage) && (
        <div
          className={cx(styles.message, {
            [styles.idle]:
              O.isSome(recentAssistantMessage) && currentTurn === "user",
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
