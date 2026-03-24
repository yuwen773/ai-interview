package interview.guide.infrastructure.file;

public record PreviewMetaDTO(
    String sourceType,
    Long sourceId,
    String filename,
    String contentType,
    String previewType,
    boolean supported,
    String previewUrl,
    String textUrl,
    String downloadUrl,
    String message
) {}
