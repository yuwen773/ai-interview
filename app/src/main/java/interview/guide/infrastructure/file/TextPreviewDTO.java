package interview.guide.infrastructure.file;

public record TextPreviewDTO(
    String filename,
    String contentType,
    String text,
    boolean truncated
) {}
