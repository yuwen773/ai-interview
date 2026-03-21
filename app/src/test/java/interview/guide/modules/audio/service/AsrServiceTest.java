package interview.guide.modules.audio.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;

/**
 * AsrService (语音转文字) 单元测试
 *
 * 测试覆盖：
 * 1. 空文件/null 处理
 * 2. 边界条件测试
 */
@DisplayName("ASR 语音转文字服务测试")
class AsrServiceTest {

    private AsrService asrService;

    @BeforeEach
    void setUp() {
        // 由于需要真实的 DashScopeAudioTranscriptionModel，
        // 这里只能测试不依赖模型调用的逻辑（空文件处理等）
        asrService = new AsrService(null);
    }

    @Test
    @DisplayName("转录 - null 文件应返回空字符串")
    void testTranscribeWithNullFile() {
        // When: 传入 null
        String result = asrService.transcribe(null);

        // Then: 应返回空字符串
        assertEquals("", result);
    }

    @Test
    @DisplayName("转录 - 空文件应返回空字符串")
    void testTranscribeWithEmptyFile() {
        // Given: 空文件
        MultipartFile emptyFile = new MockMultipartFile(
                "audio",
                "empty.wav",
                "audio/wav",
                new byte[0]
        );

        // When
        String result = asrService.transcribe(emptyFile);

        // Then
        assertEquals("", result);
    }

    @Test
    @DisplayName("转录 - 使用 MockMultipartFile 创建的空文件")
    void testTranscribeWithMockEmptyFile() {
        // Given: 使用 MockMultipartFile 创建空文件
        MultipartFile file = new MockMultipartFile(
                "audio",
                "test.wav",
                "audio/wav",
                new byte[0]
        );

        // When
        String result = asrService.transcribe(file);

        // Then: 空文件应该返回空字符串
        assertEquals("", result);
    }

    @Test
    @DisplayName("转录 - 验证服务实例化")
    void testServiceInstantiation() {
        // Then: 验证服务可以正常实例化
        assertNotNull(asrService);
    }

    @Test
    @DisplayName("转录 - WAV 格式空文件")
    void testTranscribeWavEmptyFile() {
        // Given: WAV 格式空文件
        MultipartFile wavFile = new MockMultipartFile(
                "audio",
                "speech.wav",
                "audio/wav",
                new byte[0]
        );

        // When
        String result = asrService.transcribe(wavFile);

        // Then
        assertEquals("", result);
    }

    @Test
    @DisplayName("转录 - MP3 格式空文件")
    void testTranscribeMp3EmptyFile() {
        // Given: MP3 格式空文件
        MultipartFile mp3File = new MockMultipartFile(
                "audio",
                "speech.mp3",
                "audio/mpeg",
                new byte[0]
        );

        // When
        String result = asrService.transcribe(mp3File);

        // Then
        assertEquals("", result);
    }

    @Test
    @DisplayName("转录 - PCM 格式空文件")
    void testTranscribePcmEmptyFile() {
        // Given: PCM 格式空文件
        MultipartFile pcmFile = new MockMultipartFile(
                "audio",
                "speech.pcm",
                "audio/pcm",
                new byte[0]
        );

        // When
        String result = asrService.transcribe(pcmFile);

        // Then
        assertEquals("", result);
    }

    @Test
    @DisplayName("转录 - 多次调用空文件返回一致结果")
    void testTranscribeMultipleEmptyFiles() {
        // Given: 多个空文件
        MultipartFile file1 = new MockMultipartFile("audio1", "test1.wav", "audio/wav", new byte[0]);
        MultipartFile file2 = new MockMultipartFile("audio2", "test2.mp3", "audio/mpeg", new byte[0]);

        // When
        String result1 = asrService.transcribe(file1);
        String result2 = asrService.transcribe(file2);

        // Then: 所有空文件都应返回空字符串
        assertEquals("", result1);
        assertEquals("", result2);
    }
}
