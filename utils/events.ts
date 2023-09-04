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

export const endAudioStream = event("END_AUDIO_STREAM")();
export interface endAudioStream extends t.TypeOf<typeof endAudioStream> {}

export const isSpeaking = event("IS_SPEAKING")(
  t.type({
    value: t.boolean,
  })
);
export interface isSpeaking extends t.TypeOf<typeof isSpeaking> {}

export const setChatStreamContent = event("SET_CHAT_STREAM_CONTENT")(
  t.type({
    content: t.string,
  })
);
export interface setChatStreamContent
  extends t.TypeOf<typeof setChatStreamContent> {}
