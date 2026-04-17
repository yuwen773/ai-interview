package interview.guide.modules.voiceinterview.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.guide.modules.voiceinterview.dto.WebSocketControlMessage;
import interview.guide.modules.voiceinterview.dto.WebSocketSubtitleMessage;
import interview.guide.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.guide.modules.voiceinterview.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class VoiceInterviewWebSocketHandler extends TextWebSocketHandler {

    private final DashscopeLlmService llmService;
    private final QwenAsrService asrService;
    private final QwenTtsService ttsService;
    private final VoiceInterviewService voiceService;
    private final ObjectMapper objectMapper;

    private final Map<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long sessionId = extractSessionId(session);
        sessions.put(sessionId, session);
        log.info("WebSocket connection established: sessionId={}", sessionId);

        VoiceInterviewSessionEntity interviewSession = voiceService.getSession(sessionId);
        if (interviewSession != null) {
            asrService.startTranscription(
                sessionId.toString(),
                text -> sendText(session, text),
                text -> sendSubtitle(session, text, false),
                error -> log.error("ASR error for session {}: {}", sessionId, error)
            );
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long sessionId = extractSessionId(session);
        String payload = message.getPayload();

        WebSocketControlMessage control = objectMapper.readValue(payload, WebSocketControlMessage.class);

        if ("submit".equals(control.getAction())) {
            String userText = (String) control.getData().get("text");
            handleUserInput(sessionId, session, userText);
        } else if ("audio".equals(control.getAction())) {
            // Audio data sent as base64 text
            String audioBase64 = (String) control.getData().get("audio");
            if (audioBase64 != null) {
                byte[] audioData = java.util.Base64.getDecoder().decode(audioBase64);
                asrService.sendAudio(sessionId.toString(), audioData);
            }
        } else if ("end_interview".equals(control.getAction())) {
            voiceService.endSession(sessionId.toString());
            asrService.stopTranscription(sessionId.toString());
            session.close();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long sessionId = extractSessionId(session);
        sessions.remove(sessionId);
        asrService.stopTranscription(sessionId.toString());
        voiceService.endSession(sessionId.toString());
        log.info("WebSocket connection closed: sessionId={}, status={}", sessionId, status);
    }

    private void handleUserInput(Long sessionId, WebSocketSession session, String userText) {
        try {
            VoiceInterviewSessionEntity interviewSession = voiceService.getSession(sessionId);
            if (interviewSession == null) return;

            List<String> history = voiceService.getConversationHistory(sessionId.toString()).stream()
                .map(m -> "用户: " + m.getUserRecognizedText() + "\n面试官: " + m.getAiGeneratedText())
                .toList();

            String aiResponse = llmService.chat(userText, interviewSession, history);

            voiceService.saveMessage(sessionId.toString(), userText, aiResponse);

            sendText(session, aiResponse);

            byte[] audio = ttsService.synthesize(aiResponse);
            if (audio.length > 0) {
                sendAudio(session, audio, aiResponse);
            }
        } catch (Exception e) {
            log.error("Error handling user input: sessionId={}", sessionId, e);
        }
    }

    private Long extractSessionId(WebSocketSession session) {
        String path = session.getUri().getPath();
        String[] parts = path.split("/");
        return Long.parseLong(parts[parts.length - 1]);
    }

    private void sendText(WebSocketSession session, String text) {
        try {
            String json = objectMapper.writeValueAsString(Map.of("type", "text", "content", text));
            session.sendMessage(new TextMessage(json));
        } catch (Exception e) {
            log.error("Error sending text: {}", e.getMessage());
        }
    }

    private void sendSubtitle(WebSocketSession session, String text, boolean isFinal) {
        try {
            WebSocketSubtitleMessage msg = WebSocketSubtitleMessage.builder()
                .type("subtitle")
                .text(text)
                .isFinal(isFinal)
                .build();
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
        } catch (Exception e) {
            log.error("Error sending subtitle: {}", e.getMessage());
        }
    }

    private void sendAudio(WebSocketSession session, byte[] audio, String text) {
        try {
            String base64 = java.util.Base64.getEncoder().encodeToString(audio);
            String json = objectMapper.writeValueAsString(Map.of("type", "audio", "data", base64, "text", text));
            session.sendMessage(new TextMessage(json));
        } catch (Exception e) {
            log.error("Error sending audio: {}", e.getMessage());
        }
    }
}