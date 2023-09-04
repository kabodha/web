import {
  createMachine,
  ActorRefFrom,
  InterpreterFrom,
  actions,
  assign,
} from "xstate";
import {
  endAudioStream,
  isSpeaking,
  sendMessage,
  setChatStreamContent,
  setMediaRecorder,
  startRecording,
  stopRecording,
} from "../utils/events";
import { Context } from "../utils/schemas";
import axios from "axios";
import { pipe } from "fp-ts/lib/function";
import * as RAR from "fp-ts/ReadonlyArray";
import * as O from "fp-ts/Option";
import { Readable } from "stream";

type Events =
  | setMediaRecorder
  | startRecording
  | stopRecording
  | sendMessage
  | endAudioStream
  | isSpeaking
  | setChatStreamContent;

const consoleLogContext = actions.log<Context, any>();

export const RootMachine = createMachine(
  {
    id: "root",
    initial: "active",
    predictableActionArguments: true,
    context: {
      mediaRecorder: null,
      isRecording: false,
      audioStream: O.none,
      chatStream: O.none,
      chatStreamContent: "",
      conversation: [],
      isSpeaking: false,
    },
    schema: {
      context: {} as Context,
      events: {} as Events,
    },
    tsTypes: {} as import("./root.typegen").Typegen0,
    states: {
      textToSpeech: {
        invoke: {
          src: (context) => {
            const { conversation } = context;

            const recentAssistantMessage = pipe(
              conversation,
              RAR.findLast((message) => message.role === "assistant"),
              O.map((message) => message.content)
            );

            if (O.isSome(recentAssistantMessage)) {
              return fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${process.env.NEXT_PUBLIC_VOICE_ID}/stream`,
                {
                  method: "POST",
                  headers: {
                    accept: "audio/mpeg",
                    "xi-api-key": process.env.NEXT_PUBLIC_ELEVEN_LABS_KEY,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    text: recentAssistantMessage.value,
                    model_id: "eleven_monolingual_v1",
                    optimize_streaming_latency: 4,
                    voice_settings: {
                      stability: 0.5,
                      similarity_boost: 0.5,
                    },
                  }),
                }
              );
            }
          },
          onDone: {
            target: "active",
            actions: [
              "consoleLogContext",
              assign<Context, any>({
                audioStream: (_, event) => {
                  const { data } = event;
                  return O.some(data);
                },
              }),
            ],
          },
        },
      },
      "/api/chat": {
        invoke: {
          src: (context) => {
            const { conversation } = context;

            return axios({
              method: "post",
              url: "/api/chat",
              data: {
                conversation,
              },
              responseType: "stream",
            }).then((response) => {
              return response.data;
            });
          },
          onDone: {
            target: "active",
            actions: [
              "consoleLogContext",
              assign<Context, any>({
                chatStream: (_, event) => {
                  const { data } = event;
                  return O.some(data);
                },
                // conversation: (context, event) => {
                //   const { conversation } = context;
                //   const { data: message } = event;
                //   return [...conversation, message];
                // },
              }),
            ],
          },
        },
      },
      active: {
        on: {
          SET_MEDIA_RECORDER: {
            actions: [
              "consoleLogContext",
              assign<Context, setMediaRecorder>({
                mediaRecorder: (_, event) => {
                  const { payload } = event;
                  const { mediaRecorder } = payload;
                  return mediaRecorder;
                },
              }),
            ],
          },
          START_RECORDING: {
            actions: [
              "consoleLogContext",
              assign<Context, startRecording>({
                mediaRecorder: (context) => {
                  const { mediaRecorder } = context;

                  if (mediaRecorder) {
                    mediaRecorder.start();
                  }

                  return mediaRecorder;
                },
                isRecording: true,
              }),
            ],
          },
          STOP_RECORDING: {
            actions: [
              "consoleLogContext",
              assign<Context, stopRecording>({
                mediaRecorder: (context) => {
                  const { mediaRecorder } = context;

                  if (mediaRecorder) {
                    mediaRecorder.stop();
                  }

                  return mediaRecorder;
                },
                isRecording: false,
              }),
            ],
          },
          SEND_MESSAGE: [
            {
              target: "/api/chat",
              cond: (_, event) => {
                const { payload: message } = event;
                const { role } = message as any;
                return role === "user";
              },
              actions: [
                "consoleLogContext",
                assign<Context, sendMessage>({
                  conversation: (context, event) => {
                    const { conversation } = context;
                    const { payload: message } = event;
                    return [...conversation, message];
                  },
                }),
              ],
            },
            {
              actions: [
                "consoleLogContext",
                assign<Context, sendMessage>({
                  conversation: (context, event) => {
                    const { conversation } = context;
                    const { payload: message } = event;
                    return [...conversation, message];
                  },
                  chatStream: O.none,
                }),
              ],
            },
          ],
          END_AUDIO_STREAM: {
            actions: [
              "consoleLogContext",
              assign<Context, endAudioStream>({
                audioStream: O.none,
              }),
            ],
          },
          IS_SPEAKING: {
            actions: [
              "consoleLogContext",
              assign<Context, isSpeaking>({
                isSpeaking: (_, event) => {
                  const { payload } = event;
                  const { value } = payload as any;
                  return value;
                },
              }),
            ],
          },
          SET_CHAT_STREAM_CONTENT: {
            actions: [
              "consoleLogContext",
              assign<Context, setChatStreamContent>({
                chatStreamContent: (_, event) => {
                  const { payload } = event;
                  const { content } = payload as any;
                  return content;
                },
              }),
            ],
          },
        },
      },
    },
  },
  {
    actions: {
      consoleLogContext,
    },
    services: {},
  }
);

export type RootActor = ActorRefFrom<typeof RootMachine>;
export type RootService = InterpreterFrom<typeof RootMachine>;
