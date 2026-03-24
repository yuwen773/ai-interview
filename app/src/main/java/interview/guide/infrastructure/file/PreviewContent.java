package interview.guide.infrastructure.file;

public record PreviewContent(
    String filename,
    String contentType,
    byte[] content
) {
    public PreviewContent {
        content = content == null ? null : content.clone();
    }

    @Override
    public byte[] content() {
        return content == null ? null : content.clone();
    }
}
