import styles from "../styles/index.module.scss";
import Head from "next/head";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import FormData from "form-data";
import cx from "classnames";

const voiceID = "E83lgkQqxj1opeAo4NBd";
const xiApiKey = "7b66194ad92fbf68e973456def29f632";

export default function Index() {
  const [record, setRecord] = useState(false);
  const [blobURL, setBlobURL] = useState("");
  const [transcription, setTranscription] = useState("");
  const [response, setResponse] = useState("");
  const [audio, setAudio] = useState(null);

  const mediaRecorder = useRef(null);

  useEffect(() => {
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

          const response = await axios.post(
            "https://api.openai.com/v1/audio/transcriptions",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
              },
            }
          );

          setTranscription(response.data.text);
        } catch (error) {
          console.error(error);
        }
      };
    });
  }, []);

  const startRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "recording") {
      setTranscription("");
      setResponse("");
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

  useEffect(() => {
    if (transcription) {
      axios
        .post("/api/chat", {
          message: transcription,
        })
        .then((response) => {
          setResponse(response.data.message);
        });
    }
  }, [transcription]);

  useEffect(() => {
    if (response) {
      axios
        .post(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`,
          {
            text: response,
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
          setAudio(audioUrl);
          const audio = new Audio(audioUrl);
          audio.play();
        });
    }
  }, [response]);

  return (
    <div className={styles.page}>
      <Head>
        <title>kabodha</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className={styles.controls}>
        <div
          className={cx(styles.record, { [styles.active]: record })}
          onClick={() => {
            if (record) {
              stopRecording();
            } else {
              startRecording();
            }
          }}
          type="button"
          disabled={!record}
        />
      </div>

      <audio src={blobURL} />

      <div className={cx(styles.message, { [styles.idle]: response })}>
        {transcription}
      </div>
      <div className={styles.message}>{response}</div>
    </div>
  );
}
