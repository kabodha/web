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
import OpenAI from 'openai';

const voiceID = "E83lgkQqxj1opeAo4NBd";
const xiApiKey = "7b66194ad92fbf68e973456def29f632";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  dangerouslyAllowBrowser: true
});

export default function Index() {
  const mediaRecorder = useRef(null);

  const [record, setRecord] = useState(false);
  const [blobURL, setBlobURL] = useState("");
  const [conversation, setConversation] = useState([]);
  const [chatCompleted, setChatCompleted] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [fullAssistantMessage, setFullAssistantMessage] = useState('');
  

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
          formData.append("language", "en")

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
      const main = async () => {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: recentUserMessage.value }],
        });
        const assistantResponse = response.choices[0]?.message?.content || '';
        setFullAssistantMessage(assistantResponse); // Store the full message
        setChatCompleted(true);
      };
      main();
    }
  }, [conversation, currentTurn, recentUserMessage]);


  useEffect(() => {
    if (
      O.isSome(recentUserMessage) &&
      currentTurn === "assistant" &&
      chatCompleted &&
      !audioPlaying
    ) {
      setAudioPlaying(true);

      const fetchData = async () => {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}/stream`,
          {
            method: "POST",
            headers: {
              accept: "audio/mpeg",
              "xi-api-key": xiApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: fullAssistantMessage, // Use fullAssistantMessage here
              model_id: "eleven_monolingual_v1",
              optimize_streaming_latency: 4,
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
              },
            }),
          }
        );

        const reader = response.body.getReader();
        let chunks = [];
        return reader.read().then(function process({ done, value }) {
          if (done) {
            const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
            const audioUrl = window.URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onplay = () => resolveAudioPlay(); // Resolve the promise when audio starts playing
            audio.play();
            setChatCompleted(false);
            setAudioPlaying(false);
            return;
          }
          chunks.push(value);
          return reader.read().then(process);
        });
      };

      let resolveAudioPlay;
      const audioPlayPromise = new Promise(resolve => {
        resolveAudioPlay = resolve;
      });
      const streamText = async () => {
        await audioPlayPromise;
        for (let i = 0; i < fullAssistantMessage.length; i++) {
          const partialMessage = fullAssistantMessage.slice(0, i + 1);
          setConversation((prevConversation) => {
            // If the last message is an assistant message, replace it with the new partial message
            if (prevConversation.length > 0 && prevConversation[prevConversation.length - 1].role === "assistant") {
              return [
                ...prevConversation.slice(0, prevConversation.length - 1),
                {
                  role: "assistant",
                  content: partialMessage,
                },
              ];
            }
            // Otherwise, append the new partial message to the conversation
            else {
              return [
                ...prevConversation,
                {
                  role: "assistant",
                  content: partialMessage,
                },
              ];
            }
          });
          await new Promise(resolve => setTimeout(resolve, 50)); // delay between each letter
        }
      };

      Promise.all([fetchData(), streamText()]);
    }
  }, [chatCompleted, currentTurn, recentUserMessage, audioPlaying, fullAssistantMessage]);

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
        <div className={styles.copy}>
          {record ? "Listening" : "Hold to speak"}
        </div>
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
