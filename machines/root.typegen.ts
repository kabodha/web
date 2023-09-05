// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.root./api/chat:invocation[0]": {
      type: "done.invoke.root./api/chat:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.root.textToSpeech:invocation[0]": {
      type: "done.invoke.root.textToSpeech:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    consoleLogContext:
      | "END_AUDIO_STREAM"
      | "IS_SPEAKING"
      | "SEND_MESSAGE"
      | "SET_MEDIA_RECORDER"
      | "START_RECORDING"
      | "STOP_RECORDING"
      | "done.invoke.root./api/chat:invocation[0]"
      | "done.invoke.root.textToSpeech:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {};
  matchesStates: "/api/chat" | "active" | "textToSpeech";
  tags: never;
}
