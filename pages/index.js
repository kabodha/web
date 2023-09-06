import styles from "../styles/index.module.scss";
import Head from "next/head";
import cx from "classnames";
import * as O from "fp-ts/Option";
import { Recorder } from "../components/recorder";
import { useRootMachine } from "../hooks/useRootMachine";
import { startRecording, stopRecording } from "../utils/events";
import { useSelector } from "@xstate/react";
import { Shortcuts } from "../components/shortcuts";
import { Messages } from "../components/messages";

export default function Index() {
  const rootMachine = useRootMachine();

  const chatStream = useSelector(
    rootMachine,
    (state) => state.context.chatStream
  );

  const isRecording = useSelector(
    rootMachine,
    (state) => state.context.isRecording
  );

  const isSpeaking = O.isSome(chatStream);

  return (
    <div className={styles.page}>
      <Head>
        <title>kabodha</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <Recorder />
      <Shortcuts />
      <Messages />

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
    </div>
  );
}
