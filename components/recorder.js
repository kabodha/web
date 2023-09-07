import axios from "axios";
import FormData from "form-data";
import { useRootMachine } from "../hooks/useRootMachine";
import { sendMessage, setMediaRecorder } from "../utils/events";
import { useEffectOnce } from "react-use";

export function Recorder() {
  const rootMachine = useRootMachine();

  useEffectOnce(() => {
    if (typeof window !== "undefined") {
      import("audio-recorder-polyfill").then(({ default: AudioRecorder }) => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          const mediaRecorder = new AudioRecorder(stream, {
            mimeType: "audio/ogg",
          });

          mediaRecorder.addEventListener("dataavailable", async (event) => {
            let file = new Blob([event.data], { type: "audio/ogg" });

            const formData = new FormData();
            formData.append("file", file, "audio.ogg");
            formData.append("model", "whisper-1");
            formData.append("language", "en");

            await axios
              .post(
                "https://api.openai.com/v1/audio/transcriptions",
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
                  },
                }
              )
              .then((response) => {
                const { data } = response;
                const { text } = data;

                rootMachine.send(
                  sendMessage.create({
                    role: "user",
                    content: text,
                  })
                );
              });
          });

          rootMachine.send(setMediaRecorder.create({ mediaRecorder }));
        });
      });
    }
  });
}
