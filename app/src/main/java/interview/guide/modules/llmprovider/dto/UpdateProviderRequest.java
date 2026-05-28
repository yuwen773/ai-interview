package interview.guide.modules.llmprovider.dto;

public record UpdateProviderRequest(
    String baseUrl,
    String apiKey,
    String model,
    String embeddingModel,
    Integer embeddingDimensions,
    Boolean supportsEmbedding,
    Double temperature
) {}