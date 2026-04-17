package interview.guide.modules.voiceinterview.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class VoiceInterviewWebSocketHandler extends TextWebSocketHandler {
    // TODO: 完整实现将在 Task 13 中完成

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // TODO: 完整实现将在 Task 13 中完成
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // TODO: 完整实现将在 Task 13 中完成
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // TODO: 完整实现将在 Task 13 中完成
    }
}
