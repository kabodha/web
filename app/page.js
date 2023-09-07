"use client";

import styles from "../styles/index.module.scss";
import cx from "classnames";
import { Recorder } from "../components/recorder";
import { startRecording, stopRecording } from "../utils/events";
import { useInterpret, useSelector } from "@xstate/react";
import { Shortcuts } from "../components/shortcuts";
import { Messages } from "../components/messages";
import { RootMachine } from "../machines/root";
import { AppContextProvider } from "../components/context";

export default function Index() {
  const rootMachine = useInterpret(RootMachine);

  const isRecording = useSelector(
    rootMachine,
    (state) => state.context.isRecording
  );

  return (
    <AppContextProvider {...{ rootMachine }}>
      <div className={styles.page}>
        <Recorder />
        <Shortcuts />
        <Messages />

        <div
          className={styles.controls}
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
            })}
            type="button"
            disabled={!isRecording}
          />
          <div className={styles.copy}>
            {isRecording ? "Listening" : "Hold spacebar to speak"}
          </div>
        </div>
      </div>
    </AppContextProvider>
  );
}
