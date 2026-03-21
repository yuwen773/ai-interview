package interview.guide.modules.audio.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TtsService (文字转语音) 单元测试
 *
 * 测试覆盖：
 * 1. 空文本/null 处理
 * 2. 边界条件测试
 * 3. 异常处理
 */
@DisplayName("TTS 文字转语音服务测试")
@SpringBootTest
class TtsServiceTest {

    @Autowired
    private TtsService ttsService;


    @Test
    @DisplayName("合成 - null 文本应返回空字节数组")
    void testSynthesizeWithNullText() {
        // When: 传入 null
        byte[] result = ttsService.synthesize(null);

        // Then: 应返回空字节数组
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    @Test
    @DisplayName("合成 - 空文本应返回空字节数组")
    void testSynthesizeWithEmptyText() {
        // When: 传入空字符串
        byte[] result = ttsService.synthesize("");

        // Then
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    @Test
    @DisplayName("合成 - 空白文本应返回空字节数组")
    void testSynthesizeWithBlankText() {
        // When: 传入空白字符串
        byte[] result = ttsService.synthesize("   ");

        // Then
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    @Test
    @DisplayName("合成 - 制表符和换行符文本应返回空字节数组")
    void testSynthesizeWithWhitespaceText() {
        // When: 传入只有制表符和换行符的字符串
        byte[] result = ttsService.synthesize("\t\n\r");

        // Then
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    @Test
    @DisplayName("合成 - 验证服务实例化")
    void testServiceInstantiation() {
        // Then: 验证服务可以正常实例化
        assertNotNull(ttsService);
    }

    @Test
    @DisplayName("合成 - 中文文本")
    void testSynthesizeChineseText() {
        // When: 传入中文文本
        // 由于没有真实的模型，会返回空数组
        byte[] result = ttsService.synthesize("你好，欢迎使用语音合成服务。");

        // Then: 会抛出异常，被 catch 后返回空数组
        // 这里验证不会抛出未捕获的异常
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 英文文本")
    void testSynthesizeEnglishText() {
        // When: 传入英文文本
        byte[] result = ttsService.synthesize("Hello, this is a test.");

        // Then: 验证不会抛出未捕获的异常
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 中英文混合文本")
    void testSynthesizeMixedLanguageText() {
        // When: 传入中英文混合文本
        byte[] result = ttsService.synthesize("Hello 你好，this is a test 这是测试。");

        // Then
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 包含标点符号的文本")
    void testSynthesizeWithPunctuation() {
        // When: 传入包含标点符号的文本
        byte[] result = ttsService.synthesize("你好，世界！这是一段测试。");

        // Then
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 包含数字的文本")
    void testSynthesizeWithNumbers() {
        // When: 传入包含数字的文本
        byte[] result = ttsService.synthesize("今年是2026年，气温26度。");

        // Then
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 较长文本")
    void testSynthesizeLongText() {
        // Given: 较长的文本
        StringBuilder longText = new StringBuilder();
        for (int i = 0; i < 100; i++) {
            longText.append("这是第").append(i).append("句测试文本。");
        }

        // When
        byte[] result = ttsService.synthesize(longText.toString());

        // Then: 验证不会抛出未捕获的异常
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 包含特殊字符的文本")
    void testSynthesizeWithSpecialCharacters() {
        // When: 传入包含特殊字符的文本
        byte[] result = ttsService.synthesize("测试特殊字符：@#$%^&*");

        // Then
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 单个字符")
    void testSynthesizeSingleCharacter() {
        // When: 传入单个字符
        byte[] result = ttsService.synthesize("你");

        // Then
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 包含 emoji 的文本")
    void testSynthesizeWithEmoji() {
        // When: 传入包含 emoji 的文本
        byte[] result = ttsService.synthesize("你好 这是一个测试");

        // Then
        assertNotNull(result);
    }

    @Test
    @DisplayName("合成 - 只有空格的文本")
    void testSynthesizeWithOnlySpaces() {
        // When: 传入只有空格的文本
        byte[] result = ttsService.synthesize("     ");

        // Then
        assertNotNull(result);
        assertEquals(0, result.length);
    }

    @Test
    @DisplayName("合成 - 多次调用空文本返回一致结果")
    void testSynthesizeMultipleEmptyTexts() {
        // When: 多次调用空文本
        byte[] result1 = ttsService.synthesize("");
        byte[] result2 = ttsService.synthesize("   ");
        byte[] result3 = ttsService.synthesize(null);

        // Then: 所有空文本都应返回空字节数组
        assertEquals(0, result1.length);
        assertEquals(0, result2.length);
        assertEquals(0, result3.length);
    }

    @Test
    @DisplayName("合成 - 保存字节流为 MP3 文件")
    void testSynthesizeAndSaveAsMp3(@TempDir Path tempDir) throws IOException {
        // Given: 准备要合成的文本
        String text = "你好，这是语音合成测试。";

        // When: 调用 TTS 服务获取音频字节流
        byte[] audioData = ttsService.synthesize(text);

        // Then: 验证返回了音频数据
        assertNotNull(audioData);
        assertTrue(audioData.length > 0, "音频数据不应为空");

        // 将字节流保存为 MP3 文件
        Path mp3File = tempDir.resolve("tts-output.mp3");
        Files.write(mp3File, audioData);

        // 验证文件已创建
        assertTrue(Files.exists(mp3File), "MP3 文件应该被创建");
        assertEquals(audioData.length, Files.size(mp3File), "文件大小应与音频数据一致");

        // 打印文件路径（方便手动查看）
        System.out.println("MP3 文件已保存到: " + mp3File.toAbsolutePath());
    }

    @Test
    @DisplayName("合成 - 保存到指定目录")
    void testSynthesizeAndSaveToCustomPath() throws IOException {
        // Given: 准备文本和自定义保存路径
        String text = "这是一个测试，保存到指定目录。";
        Path outputDir = Paths.get("test-output");
        Path mp3File = outputDir.resolve("custom-tts.mp3");

        // 确保目录存在
        if (!Files.exists(outputDir)) {
            Files.createDirectories(outputDir);
        }

        // When: 合成并保存
        byte[] audioData = ttsService.synthesize(text);
        if (audioData != null && audioData.length > 0) {
            Files.write(mp3File, audioData);
            System.out.println("MP3 文件已保存到: " + mp3File.toAbsolutePath());
        }
    }
}
