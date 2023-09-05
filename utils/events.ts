import * as t from "io-ts";
import { event } from "@marblejs/core";
import { Message } from "./schemas";

export const setMediaRecorder = event("SET_MEDIA_RECORDER")(
  t.type({
    mediaRecorder: t.unknown,
  })
);
export interface setMediaRecorder extends t.TypeOf<typeof setMediaRecorder> {}

export const startRecording = event("START_RECORDING")();
export interface startRecording extends t.TypeOf<typeof startRecording> {}

export const stopRecording = event("STOP_RECORDING")();
export interface stopRecording extends t.TypeOf<typeof stopRecording> {}

export const sendMessage = event("SEND_MESSAGE")(Message);
export interface sendMessage extends t.TypeOf<typeof sendMessage> {}
