import * as t from "io-ts";

export const Message = t.type({
  role: t.union([t.literal("user"), t.literal("assistant")]),
  content: t.string,
});

export const Context = t.type({
  mediaRecorder: t.unknown,
  conversation: t.array(Message),
  isRecording: t.boolean,
  audioStream: t.unknown,
  chatStream: t.unknown,
  isSpeaking: t.boolean,
  socket: t.unknown,
});
export interface Context extends t.TypeOf<typeof Context> {}
