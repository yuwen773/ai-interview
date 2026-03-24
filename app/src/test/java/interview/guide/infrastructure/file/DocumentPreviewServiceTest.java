package interview.guide.infrastructure.file;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.guide.modules.knowledgebase.service.KnowledgeBaseListService;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.service.ResumeHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DocumentPreviewServiceTest {

    private ResumeHistoryService resumeHistoryService;
    private KnowledgeBaseListService knowledgeBaseListService;
    private FileStorageService fileStorageService;
    private DocumentPreviewService documentPreviewService;

    @BeforeEach
    void setUp() {
        resumeHistoryService = mock(ResumeHistoryService.class);
        knowledgeBaseListService = mock(KnowledgeBaseListService.class);
        fileStorageService = mock(FileStorageService.class);
        documentPreviewService = new DocumentPreviewService(
            resumeHistoryService,
            knowledgeBaseListService,
            fileStorageService
        );
    }

    @Test
    @DisplayName("shouldReturnPdfPreviewMetaForResumePdf")
    void shouldReturnPdfPreviewMetaForResumePdf() {
        ResumeEntity entity = new ResumeEntity();
        entity.setId(1L);
        entity.setOriginalFilename("resume.pdf");
        entity.setContentType("application/pdf");
        entity.setStorageKey("resumes/1.pdf");
        when(resumeHistoryService.getResumeEntity(1L)).thenReturn(entity);

        PreviewMetaDTO result = documentPreviewService.buildResumePreviewMeta(1L);

        assertEquals("RESUME", result.sourceType());
        assertEquals(1L, result.sourceId());
        assertEquals("pdf", result.previewType());
        assertTrue(result.supported());
        assertNotNull(result.previewUrl());
        assertFalse(result.previewUrl().isBlank());
        assertNull(result.textUrl());
        assertNotNull(result.downloadUrl());
    }

    @Test
    @DisplayName("shouldReturnTextPreviewMetaForKnowledgeBaseMarkdown")
    void shouldReturnTextPreviewMetaForKnowledgeBaseMarkdown() {
        KnowledgeBaseEntity entity = new KnowledgeBaseEntity();
        entity.setId(2L);
        entity.setOriginalFilename("guide.md");
        entity.setContentType("application/octet-stream");
        entity.setStorageKey("knowledgebases/guide.md");
        when(knowledgeBaseListService.getEntityForPreview(2L)).thenReturn(entity);

        PreviewMetaDTO result = documentPreviewService.buildKnowledgeBasePreviewMeta(2L);

        assertEquals("KNOWLEDGE_BASE", result.sourceType());
        assertEquals(2L, result.sourceId());
        assertEquals("text", result.previewType());
        assertTrue(result.supported());
        assertNull(result.previewUrl());
        assertNotNull(result.textUrl());
        assertFalse(result.textUrl().isBlank());
        assertNotNull(result.downloadUrl());
    }

    @Test
    @DisplayName("shouldReturnUnsupportedPreviewMetaForDocx")
    void shouldReturnUnsupportedPreviewMetaForDocx() {
        ResumeEntity entity = new ResumeEntity();
        entity.setId(3L);
        entity.setOriginalFilename("resume.docx");
        entity.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        entity.setStorageKey("resumes/3.docx");
        when(resumeHistoryService.getResumeEntity(3L)).thenReturn(entity);

        PreviewMetaDTO result = documentPreviewService.buildResumePreviewMeta(3L);

        assertEquals("unsupported", result.previewType());
        assertFalse(result.supported());
        assertNull(result.previewUrl());
        assertNull(result.textUrl());
        assertEquals("当前格式暂不支持在线预览，请下载后查看", result.message());
    }

    @Test
    @DisplayName("shouldNotTreatMimeOnlyMatchAsPdfPreview")
    void shouldNotTreatMimeOnlyMatchAsPdfPreview() {
        ResumeEntity entity = new ResumeEntity();
        entity.setId(7L);
        entity.setOriginalFilename("resume.docx");
        entity.setContentType("application/pdf");
        entity.setStorageKey("resumes/7.docx");
        when(resumeHistoryService.getResumeEntity(7L)).thenReturn(entity);

        PreviewMetaDTO result = documentPreviewService.buildResumePreviewMeta(7L);

        assertEquals("unsupported", result.previewType());
        assertFalse(result.supported());
        assertNull(result.previewUrl());
        assertNull(result.textUrl());
        assertEquals("当前格式暂不支持在线预览，请下载后查看", result.message());
    }

    @Test
    @DisplayName("shouldTreatPdfExtensionAsPreviewableEvenWhenMimeDiffers")
    void shouldTreatPdfExtensionAsPreviewableEvenWhenMimeDiffers() {
        ResumeEntity entity = new ResumeEntity();
        entity.setId(8L);
        entity.setOriginalFilename("resume.pdf");
        entity.setContentType("application/octet-stream");
        entity.setStorageKey("resumes/8.pdf");
        when(resumeHistoryService.getResumeEntity(8L)).thenReturn(entity);

        PreviewMetaDTO result = documentPreviewService.buildResumePreviewMeta(8L);

        assertEquals("pdf", result.previewType());
        assertTrue(result.supported());
        assertNotNull(result.previewUrl());
        assertNull(result.textUrl());
    }

    @Test
    @DisplayName("shouldReturnTruncatedTextPreviewWhenTextExceedsLimit")
    void shouldReturnTruncatedTextPreviewWhenTextExceedsLimit() {
        KnowledgeBaseEntity entity = new KnowledgeBaseEntity();
        entity.setId(4L);
        entity.setOriginalFilename("guide.md");
        entity.setContentType("application/octet-stream");
        entity.setStorageKey("knowledgebases/4.md");
        when(knowledgeBaseListService.getEntityForPreview(4L)).thenReturn(entity);

        String content = "你".repeat(DocumentPreviewService.MAX_PREVIEW_CHARS + 20);
        when(fileStorageService.downloadFile("knowledgebases/4.md"))
            .thenReturn(content.getBytes(StandardCharsets.UTF_8));

        TextPreviewDTO result = documentPreviewService.loadKnowledgeBaseTextPreview(4L);

        assertEquals("guide.md", result.filename());
        assertEquals("application/octet-stream", result.contentType());
        assertEquals(DocumentPreviewService.MAX_PREVIEW_CHARS, result.text().length());
        assertTrue(result.truncated());
        assertEquals("你".repeat(DocumentPreviewService.MAX_PREVIEW_CHARS), result.text());
    }

    @Test
    @DisplayName("shouldRejectPreviewContentForUnsupportedType")
    void shouldRejectPreviewContentForUnsupportedType() {
        ResumeEntity entity = new ResumeEntity();
        entity.setId(5L);
        entity.setOriginalFilename("resume.docx");
        entity.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        entity.setStorageKey("resumes/5.docx");
        when(resumeHistoryService.getResumeEntity(5L)).thenReturn(entity);

        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> documentPreviewService.loadResumePreviewContent(5L)
        );

        assertEquals(ErrorCode.STORAGE_DOWNLOAD_FAILED.getCode(), exception.getCode());
        assertEquals("当前格式暂不支持在线预览，请下载后查看", exception.getMessage());
    }

    @Test
    @DisplayName("shouldRejectTextPreviewWhenFilenameIsNotTxtOrMd")
    void shouldRejectTextPreviewWhenFilenameIsNotTxtOrMd() {
        KnowledgeBaseEntity entity = new KnowledgeBaseEntity();
        entity.setId(6L);
        entity.setOriginalFilename("guide.markdown");
        entity.setContentType("text/markdown");
        entity.setStorageKey("knowledgebases/6.markdown");
        when(knowledgeBaseListService.getEntityForPreview(6L)).thenReturn(entity);

        BusinessException exception = assertThrows(
            BusinessException.class,
            () -> documentPreviewService.loadKnowledgeBaseTextPreview(6L)
        );

        assertEquals(ErrorCode.STORAGE_DOWNLOAD_FAILED.getCode(), exception.getCode());
        assertEquals("当前格式暂不支持在线预览，请下载后查看", exception.getMessage());
    }

    @Test
    @DisplayName("shouldDefensivelyCopyPreviewContentBytes")
    void shouldDefensivelyCopyPreviewContentBytes() {
        byte[] original = new byte[] {1, 2, 3};

        PreviewContent content = new PreviewContent("resume.pdf", "application/pdf", original);

        original[0] = 9;
        assertArrayEquals(new byte[] {1, 2, 3}, content.content());

        byte[] exposed = content.content();
        exposed[1] = 8;
        assertArrayEquals(new byte[] {1, 2, 3}, content.content());
    }
}
