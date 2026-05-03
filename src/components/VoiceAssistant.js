import React, { useState } from "react";
import { getAIResponse } from "./AiService";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";

export default function VoiceAssistant() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");

  const startListening = () => {
    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);

      const aiReply = await getAIResponse(transcript);
      setResponse(aiReply);

      speak(aiReply);
    };
  };

  const speak = (message) => {
    const speech = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>🎤 AI Voice Assistant</h2>
      <button onClick={startListening}>Start Talking</button>
      <p><b>You:</b> {text}</p>
      <p><b>AI:</b> {response}</p>
    </div>
  );
}