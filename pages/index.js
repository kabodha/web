import styles from "../styles/index.module.scss";
import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import FormData from "form-data";
import cx from "classnames";
import { pipe } from "fp-ts/lib/function";
import * as RAR from "fp-ts/ReadonlyArray";
import * as O from "fp-ts/Option";
import { useEffectOnce } from "react-use";

const voiceID = "E83lgkQqxj1opeAo4NBd";
const xiApiKey = "7b66194ad92fbf68e973456def29f632";

export default function Index() {
  const mediaRecorder = useRef(null);

  const [record, setRecord] = useState(false);
  const [blobURL, setBlobURL] = useState("");
  const [conversation, setConversation] = useState([]);
  const [chatCompleted, setChatCompleted] = useState(false);

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

  console.log(conversation);

  const startRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "recording") {
      mediaRecorder.current.start();
      setRecord(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setRecord(false);
    }
  };

  useEffectOnce(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = async (e) => {
        const url = URL.createObjectURL(e.data);

        setBlobURL(url);

        let file = new Blob([e.data], { type: "audio/webm" });
        const model = "whisper-1";

        try {
          const formData = new FormData();
          formData.append("file", file, "audio.webm");
          formData.append("model", model);

          const whisperResponse = await axios.post(
            "https://api.openai.com/v1/audio/transcriptions",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
              },
            }
          );

          setConversation((prevConversation) => [
            ...prevConversation,
            {
              role: "user",
              content: whisperResponse.data.text,
            },
          ]);
        } catch (error) {
          console.error(error);
        }
      };
    });
  });

  useEffect(() => {
    if (O.isSome(recentUserMessage) && currentTurn === "assistant") {
      axios
        .post("/api/chat", {
          conversation,
        })
        .then((response) => {
          setConversation((prevConversation) => [
            ...prevConversation,
            {
              role: "assistant",
              content: response.data.message,
            },
          ]);

          setChatCompleted(true);
        });
    }
  }, [conversation, currentTurn, recentUserMessage]);

  useEffect(() => {
    if (
      O.isSome(recentAssistantMessage) &&
      currentTurn === "user" &&
      chatCompleted
    ) {
      axios
        .post(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`,
          {
            text: recentAssistantMessage.value,
            model_id: "eleven_multilingual_v2",
          },
          {
            headers: {
              accept: "audio/mpeg",
              "xi-api-key": xiApiKey,
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
          }
        )
        .then(async (response) => {
          const audioBlob = response.data;
          const audioUrl = window.URL.createObjectURL(
            new Blob([audioBlob], { type: "audio/mpeg" })
          );
          const audio = new Audio(audioUrl);
          audio.play();
          setChatCompleted(false);
        });
    }
  }, [chatCompleted, currentTurn, recentAssistantMessage]);

  return (
    <div className={styles.page}>
      <Head>
        <title>kabodha</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div
        className={styles.controls}
        onPointerDown={() => {
          startRecording();
        }}
        onPointerUp={() => {
          stopRecording();
        }}
      >
        <div
          className={cx(styles.record, { [styles.active]: record })}
          type="button"
          disabled={!record}
        />
      </div>

      <audio src={blobURL} />

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
