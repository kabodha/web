import styles from "../styles/index.module.scss";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import FormData from "form-data";

export default function Index() {
  const [record, setRecord] = useState(false);
  const [blobURL, setBlobURL] = useState("");
  const [transcription, setTranscription] = useState("");

  const mediaRecorder = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = async (e) => {
        const url = URL.createObjectURL(e.data);

        setBlobURL(url);

        // Create form data to send to the API
        let file = new Blob([e.data], { type: "audio/webm" });
        const model = "whisper-1";

        // Send the audio file to the OpenAI Whisper API
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

  return (
    <div className={styles.page}>
      <div className={styles.controls}>
        <button onClick={startRecording} type="button" disabled={record}>
          Start
        </button>
        <button onClick={stopRecording} type="button" disabled={!record}>
          Stop
        </button>
      </div>

      <audio src={blobURL} />

      <div className={styles.message}>{transcription}</div>
    </div>
  );
}
