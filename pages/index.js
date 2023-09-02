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
        const stream = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: recentUserMessage.value }],
          stream: true,
        });

        const voiceId = "E83lgkQqxj1opeAo4NBd"; // replace with your voice_id
        const model = 'eleven_monolingual_v1';
        const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_type=${model}`;
        const socket = new WebSocket(wsUrl);

        let assistantResponse = ''; // Define assistantResponse here

        socket.onopen = async function (event) {
          const bosMessage = {
            "text": " ",
            "voice_settings": {
              "stability": 0.5,
              "similarity_boost": true
            },
            "xi_api_key": xiApiKey,
          };

          socket.send(JSON.stringify(bosMessage));

          for await (const part of stream) {
            const content = part.choices[0]?.delta?.content || '';
            assistantResponse += content;

            const textMessage = {
              "text": content + " ",
              "try_trigger_generation": true,
            };

            socket.send(JSON.stringify(textMessage));
          }

          console.log("Assistant Message", assistantResponse)
          setAssistantMessage(assistantResponse);
          setConversation((prevConversation) => [
            ...prevConversation,
            {
              role: "assistant",
              content: assistantResponse,
            },
          ]);
          setChatCompleted(true);
          const eosMessage = {
            "text": ""
          };

          socket.send(JSON.stringify(eosMessage));
        };

        // let source = null;
        let shouldStartNextSource = false;

        let audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let audioQueue = [];
        let messageQueue = [];
        let source = null;

        socket.onmessage = function (event) {
          messageQueue.push(event.data);
          processMessages();
        };

        async function processMessages() {
          while (messageQueue.length > 0) {
            const data = messageQueue.shift();
            const response = JSON.parse(data);

            if (response.audio) {
              const audioData = atob(response.audio);  // decode base64
              const audioArray = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
              }

              const audioBuffer = await audioContext.decodeAudioData(audioArray.buffer);
              audioQueue.push(audioBuffer);

              if (!source || source.context.state === 'closed') {
                playNextAudio();
              }
            }
          }
        }

        function playNextAudio() {
          if (audioQueue.length > 0) {
            source = audioContext.createBufferSource();
            source.buffer = audioQueue.shift();
            source.connect(audioContext.destination);
            source.start();

            source.onended = function () {
              playNextAudio();
            };
          }
        }



        socket.onerror = function (error) {
          console.error(`WebSocket Error: ${error}`);
        };

        socket.onclose = function (event) {
          if (audioQueue.length === 0 && (!source || source.context.state === 'closed')) {
            if (event.wasClean) {
              console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
            } else {
              console.warn('Connection died');
            }
          }
        };

      };
      main();
    }
  }, [conversation, currentTurn, recentUserMessage]);

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