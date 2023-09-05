import {
  createMachine,
  ActorRefFrom,
  InterpreterFrom,
  actions,
  assign,
} from "xstate";
import {
  sendMessage,
  setMediaRecorder,
  startRecording,
  stopRecording,
} from "../utils/events";
import { Context } from "../utils/schemas";
import * as O from "fp-ts/Option";
import { Observable } from "rxjs";
import { webSocket } from "rxjs/webSocket";
import { concatMap } from "rxjs/operators";
import { pipe } from "fp-ts/lib/function";
import * as RAR from "fp-ts/ReadonlyArray";

const createStreamObservable = (conversation) => {
  return new Observable((subscriber) => {
    fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        conversation,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        const reader = response.body.getReader();

        return new ReadableStream({
          start: () => {
            function push() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  subscriber.next({ type: "DATA", payload: "" });
                  subscriber.complete();
                  return;
                }

                const text = new TextDecoder("utf-8").decode(value);
                subscriber.next({ type: "DATA", payload: text });
                push();
              });
            }

            push();
          },
          cancel: () => {
            reader.cancel();
            subscriber.complete();
          },
        });
      })
      .catch((error) => {
        subscriber.error(error);
      });
  });
};

type Events = setMediaRecorder | startRecording | stopRecording | sendMessage;

const consoleLogContext = actions.log<Context, any>();

export const RootMachine = createMachine(
  {
    id: "root",
    initial: "active",
    predictableActionArguments: true,
    context: {
      mediaRecorder: null,
      isRecording: false,
      audioStream: null,
      chatStream: O.none,
      conversation: [],
      isSpeaking: false,
      socket: webSocket(
        `wss://api.elevenlabs.io/v1/text-to-speech/${process.env.NEXT_PUBLIC_VOICE_ID}/stream-input?model_type=eleven_monolingual_v1`
      ),
    },
    schema: {
      context: {} as Context,
      events: {} as Events,
    },
    tsTypes: {} as import("./root.typegen").Typegen0,
    states: {
      completeChat: {
        invoke: {
          src: (context) => createStreamObservable(context.conversation),
          onDone: {
            target: "active",
            actions: [
              "consoleLogContext",
              assign<Context, any>({
                chatStream: O.none,
              }),
            ],
          },
        },
        on: {
          // @ts-ignore
          DATA: {
            actions: [
              assign<Context, any>({
                chatStream: (context, event) => {
                  const { socket } = context;
                  const { payload: text } = event;

                  socket.next({
                    text: text === "" ? "" : `${text} `,
                    try_trigger_generation: true,
                  });

                  return O.some(text);
                },
                conversation: (context, event) => {
                  const { conversation } = context;
                  const { payload: text } = event;

                  const recentMessage = pipe(conversation, RAR.last);

                  if (
                    O.isSome(recentMessage) &&
                    recentMessage.value.role === "assistant"
                  ) {
                    const prevText = recentMessage.value.content;
                    const newText = `${prevText}${text}`;

                    return [
                      ...conversation.slice(0, -1),
                      { role: "assistant", content: newText },
                    ];
                  } else {
                    return [
                      ...conversation,
                      { role: "assistant", content: text },
                    ];
                  }
                },
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
          START_RECORDING: [
            {
              cond: (context) => {
                const { isRecording } = context;
                return !isRecording;
              },
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
          ],
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
          SEND_MESSAGE: {
            target: "completeChat",
            actions: [
              "consoleLogContext",
              assign<Context, sendMessage>({
                conversation: (context, event) => {
                  const { conversation } = context;
                  const { payload: message } = event;
                  return [...conversation, message];
                },
                audioStream: (context) => {
                  const { socket } = context;

                  let sourceBuffer;

                  const mediaSource = new MediaSource();
                  const audioElement = new Audio();
                  audioElement.src = URL.createObjectURL(mediaSource);
                  audioElement.play();

                  mediaSource.addEventListener("sourceopen", () => {
                    sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                  });

                  return socket
                    .pipe(
                      concatMap((data) => {
                        // @ts-ignore
                        const { audio, isFinal } = data;

                        if (!isFinal) {
                          const audioData = Uint8Array.from(atob(audio), (c) =>
                            c.charCodeAt(0)
                          );

                          if (sourceBuffer.updating) {
                            sourceBuffer.addEventListener(
                              "updateend",
                              () => {
                                sourceBuffer.appendBuffer(audioData.buffer);
                              },
                              { once: true }
                            );
                          } else {
                            sourceBuffer.appendBuffer(audioData.buffer);
                          }

                          // @ts-ignore
                          return new Promise((resolve) => resolve());
                        } else {
                          // @ts-ignore
                          return new Promise((resolve) => resolve());
                        }
                      })
                    )
                    .subscribe();
                },
              }),
              "pingSocket",
            ],
          },
        },
      },
    },
  },
  {
    actions: {
      consoleLogContext,
      pingSocket: (context) => {
        const { socket } = context;

        const bosMessage = {
          text: " ",
          voice_settings: {
            stability: 0.5,
            similarity_boost: true,
          },
          xi_api_key: process.env.NEXT_PUBLIC_ELEVEN_LABS_KEY,
        };
        // @ts-ignore
        socket.next(bosMessage);
      },
    },
    services: {},
  }
);

export type RootActor = ActorRefFrom<typeof RootMachine>;
export type RootService = InterpreterFrom<typeof RootMachine>;
