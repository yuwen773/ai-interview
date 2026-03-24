package interview.guide.infrastructure.file;

import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.guide.modules.knowledgebase.service.KnowledgeBaseListService;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.service.ResumeHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DocumentPreviewService {

    static final int MAX_PREVIEW_CHARS = 4_000;
    private static final String SOURCE_TYPE_RESUME = "RESUME";
    private static final String SOURCE_TYPE_KNOWLEDGE_BASE = "KNOWLEDGE_BASE";
    private static final String PREVIEW_TYPE_PDF = "pdf";
    private static final String PREVIEW_TYPE_TEXT = "text";
    private static final String PREVIEW_TYPE_UNSUPPORTED = "unsupported";
    private static final String UNSUPPORTED_MESSAGE = "当前格式暂不支持在线预览，请下载后查看";

    private final ResumeHistoryService resumeHistoryService;
    private final KnowledgeBaseListService knowledgeBaseListService;
    private final FileStorageService fileStorageService;

    public PreviewMetaDTO buildResumePreviewMeta(Long resumeId) {
        ResumeEntity entity = resumeHistoryService.getResumeEntity(resumeId);
        return buildPreviewMeta(
            SOURCE_TYPE_RESUME,
            entity.getId(),
            entity.getOriginalFilename(),
            entity.getContentType(),
            "/api/resumes/" + resumeId + "/preview/content",
            "/api/resumes/" + resumeId + "/preview/text",
            "/api/resumes/" + resumeId + "/download"
        );
    }

    public PreviewMetaDTO buildKnowledgeBasePreviewMeta(Long knowledgeBaseId) {
        KnowledgeBaseEntity entity = knowledgeBaseListService.getEntityForPreview(knowledgeBaseId);
        return buildPreviewMeta(
            SOURCE_TYPE_KNOWLEDGE_BASE,
            entity.getId(),
            entity.getOriginalFilename(),
            entity.getContentType(),
            "/api/knowledgebase/" + knowledgeBaseId + "/preview/content",
            "/api/knowledgebase/" + knowledgeBaseId + "/preview/text",
            "/api/knowledgebase/" + knowledgeBaseId + "/download"
        );
    }

    public PreviewContent loadResumePreviewContent(Long resumeId) {
        ResumeEntity entity = resumeHistoryService.getResumeEntity(resumeId);
        return loadPreviewContent(entity.getOriginalFilename(), entity.getContentType(), entity.getStorageKey());
    }

    public PreviewContent loadKnowledgeBasePreviewContent(Long knowledgeBaseId) {
        KnowledgeBaseEntity entity = knowledgeBaseListService.getEntityForPreview(knowledgeBaseId);
        return loadPreviewContent(entity.getOriginalFilename(), entity.getContentType(), entity.getStorageKey());
    }

    public TextPreviewDTO loadResumeTextPreview(Long resumeId) {
        ResumeEntity entity = resumeHistoryService.getResumeEntity(resumeId);
        return loadTextPreview(entity.getOriginalFilename(), entity.getContentType(), entity.getStorageKey());
    }

    public TextPreviewDTO loadKnowledgeBaseTextPreview(Long knowledgeBaseId) {
        KnowledgeBaseEntity entity = knowledgeBaseListService.getEntityForPreview(knowledgeBaseId);
        return loadTextPreview(entity.getOriginalFilename(), entity.getContentType(), entity.getStorageKey());
    }

    private PreviewMetaDTO buildPreviewMeta(
        String sourceType,
        Long sourceId,
        String filename,
        String contentType,
        String previewUrl,
        String textUrl,
        String downloadUrl
    ) {
        if (isPdf(filename, contentType)) {
            return new PreviewMetaDTO(
                sourceType,
                sourceId,
                filename,
                contentType,
                PREVIEW_TYPE_PDF,
                true,
                previewUrl,
                null,
                downloadUrl,
                null
            );
        }

        if (isText(filename, contentType)) {
            return new PreviewMetaDTO(
                sourceType,
                sourceId,
                filename,
                contentType,
                PREVIEW_TYPE_TEXT,
                true,
                null,
                textUrl,
                downloadUrl,
                null
            );
        }

        return new PreviewMetaDTO(
            sourceType,
            sourceId,
            filename,
            contentType,
            PREVIEW_TYPE_UNSUPPORTED,
            false,
            null,
            null,
            downloadUrl,
            UNSUPPORTED_MESSAGE
        );
    }

    private PreviewContent loadPreviewContent(String filename, String contentType, String storageKey) {
        ensurePdfPreviewSupported(filename, contentType);
        return new PreviewContent(filename, contentType, download(storageKey));
    }

    private TextPreviewDTO loadTextPreview(String filename, String contentType, String storageKey) {
        ensureTextPreviewSupported(filename, contentType);
        String text = new String(download(storageKey), StandardCharsets.UTF_8);
        boolean truncated = text.length() > MAX_PREVIEW_CHARS;
        if (truncated) {
            text = text.substring(0, MAX_PREVIEW_CHARS);
        }
        return new TextPreviewDTO(filename, contentType, text, truncated);
    }

    private byte[] download(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new BusinessException(ErrorCode.STORAGE_DOWNLOAD_FAILED, "文件存储信息不存在");
        }
        return fileStorageService.downloadFile(storageKey);
    }

    private boolean isPdf(String filename, String contentType) {
        return hasExtension(filename, ".pdf");
    }

    private boolean isText(String filename, String contentType) {
        return hasExtension(filename, ".txt")
            || hasExtension(filename, ".md")
            ;
    }

    private void ensurePdfPreviewSupported(String filename, String contentType) {
        if (!isPdf(filename, contentType)) {
            throw new BusinessException(ErrorCode.STORAGE_DOWNLOAD_FAILED, UNSUPPORTED_MESSAGE);
        }
    }

    private void ensureTextPreviewSupported(String filename, String contentType) {
        if (!isText(filename, contentType)) {
            throw new BusinessException(ErrorCode.STORAGE_DOWNLOAD_FAILED, UNSUPPORTED_MESSAGE);
        }
    }

    private boolean hasExtension(String filename, String extension) {
        return filename != null && filename.toLowerCase(Locale.ROOT).endsWith(extension);
    }

    private String normalize(String contentType) {
        if (contentType == null) {
            return "";
        }
        int separatorIndex = contentType.indexOf(';');
        if (separatorIndex >= 0) {
            return contentType.substring(0, separatorIndex).trim();
        }
        return contentType.trim();
    }
}
