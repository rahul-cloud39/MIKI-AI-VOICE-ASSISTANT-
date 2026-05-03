import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAIResponse } from "./AiService";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslation } from "../utils/i18n";
import { commandProcessor } from "../utils/CommandProcessor";
import "./VoiceAssistant.css";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceAssistant({ onEvent }) {
  const { language, voice } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const retryUsedRef = useRef(false);
  const retryTimerRef = useRef(null);

  const [text, setText] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState([]);
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(Boolean(SpeechRecognition));

  const speakResponse = useCallback((message) => {
    const speech = new SpeechSynthesisUtterance(message);

    speech.lang = language === "hi" ? "hi-IN" : "en-US";

    const voices = window.speechSynthesis.getVoices();
    if (voice === "male") {
      const maleVoice = voices.find((v) => v.name.includes("Male")) || voices[0];
      speech.voice = maleVoice;
    } else {
      const femaleVoice = voices.find((v) => v.name.includes("Female")) || voices[1];
      speech.voice = femaleVoice;
    }

    speech.rate = 1;
    speech.pitch = voice === "male" ? 0.8 : 1.2;
    window.speechSynthesis.speak(speech);
  }, [language, voice]);

  const getMicrophoneAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  }, []);

  const startListening = useCallback(async () => {
    if (!voiceSupported || !recognitionRef.current) {
      setVoiceError("Voice input is not available in this browser.");
      return;
    }

    if (recognitionActiveRef.current) {
      return;
    }

    recognitionActiveRef.current = true;
    retryUsedRef.current = false;
    setVoiceError("");
    setResponse("");
    setText("");

    try {
      const hasMicAccess = await getMicrophoneAccess();
      if (!hasMicAccess) {
        throw new Error("Microphone access is not available.");
      }

      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      recognitionActiveRef.current = false;
      setIsListening(false);
      if (error.name === "NotAllowedError" || error.name === "SecurityError") {
        setVoiceError("Microphone access is blocked. Open browser permissions for localhost:5000 and allow microphone access.");
        setResponse("Error: microphone access is blocked.");
        return;
      }

      setVoiceError("Could not start voice input. Please allow microphone access and try again.");
      setResponse("Error: " + error.message);
    }
  }, [getMicrophoneAccess, voiceSupported]);

  useEffect(() => {
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceError("Voice input is not supported in this browser. You can still type your question.");
      return;
    }

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" })
        .then((status) => {
          if (status.state === "denied") {
            setVoiceError("Microphone permission is blocked in this browser. Allow mic access for localhost:5000 from the browser settings.");
          }
        })
        .catch(() => {
          // Some browsers do not expose microphone permission status.
        });
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === "hi" ? "hi-IN" : "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("Listening... speak clearly now.");
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      setVoiceError("");

      const commandResult = commandProcessor.processCommand(transcript);
      if (commandResult.executed) {
        setResponse(commandResult.message);
        speakResponse(commandResult.message);
        setHistory((prev) => [
          ...prev,
          { user: transcript, ai: commandResult.message, time: new Date(), isCommand: true }
        ]);
        onEvent?.();
        return;
      }

      try {
        const aiReply = await getAIResponse(transcript);
        setResponse(aiReply);
        speakResponse(aiReply);
        setHistory((prev) => [
          ...prev,
          { user: transcript, ai: aiReply, time: new Date() }
        ]);
        onEvent?.();
      } catch (error) {
        setResponse("Error: " + error.message);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionActiveRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError("Microphone access is blocked. Allow microphone permission for this site, or use the text box below.");
        setResponse("Error: microphone access is blocked.");
        return;
      }

      if (event.error === "no-speech") {
        if (!retryUsedRef.current) {
          retryUsedRef.current = true;
          setVoiceError("No speech detected. Retrying once...");
          retryTimerRef.current = setTimeout(() => {
            startListening();
          }, 250);
          return;
        }

        setVoiceError("No speech detected. Try again or type your question.");
        setResponse("Error: no speech detected.");
        return;
      }

      setVoiceError(`Voice input error: ${event.error}`);
      setResponse("Error: " + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionActiveRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.onstart = null;
        recognition.abort();
        recognitionActiveRef.current = false;
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      } catch (error) {
        // Ignore cleanup errors when the browser has already stopped recognition.
      }
    };
  }, [language, onEvent, speakResponse, startListening]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";
    }
  }, [language]);

  const handleTextInput = async (e) => {
    if (e.key === "Enter" && text) {
      const commandResult = commandProcessor.processCommand(text);
      if (commandResult.executed) {
        setResponse(commandResult.message);
        speakResponse(commandResult.message);
        setHistory((prev) => [
          ...prev,
          { user: text, ai: commandResult.message, time: new Date(), isCommand: true }
        ]);
        setText("");
        onEvent?.();
        return;
      }

      try {
        const aiReply = await getAIResponse(text);
        setResponse(aiReply);
        speakResponse(aiReply);
        setHistory((prev) => [
          ...prev,
          { user: text, ai: aiReply, time: new Date() }
        ]);
        setText("");
        onEvent?.();
      } catch (error) {
        setResponse("Error: " + error.message);
      }
    }
  };

  return (
    <div className="voice-assistant">
      <div className="voice-main">
        <div className="voice-input-section">
          <h3>{t("voiceChat")}</h3>
          <button
            onClick={startListening}
            className={`voice-btn ${isListening ? "listening" : ""}`}
            disabled={isListening || !voiceSupported}
          >
            {isListening ? t("listening") : t("startTalking")}
          </button>

          {voiceError && (
            <div className="voice-status">
              <p>{voiceError}</p>
            </div>
          )}

          <div className="text-input-section">
            <input
              type="text"
              placeholder={t("typeQuestion")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextInput}
              className="text-input"
            />
          </div>
        </div>

        {text && (
          <div className="voice-display user-text">
            <p>
              <strong>{t("you")}</strong> {text}
            </p>
          </div>
        )}

        {response && (
          <div className="voice-display ai-text">
            <p>
              <strong>MIKI:</strong> {response}
            </p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="voice-history">
          <h4>{t("conversationHistory")}</h4>
          <div className="history-list">
            {history.map((entry, index) => (
              <div key={index} className="history-item">
                <p className="user">
                  <strong>{t("you")}</strong> {entry.user}
                </p>
                <p className={`ai ${entry.isCommand ? "command" : ""}`}>
                  <strong>MIKI:</strong> {entry.ai}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
