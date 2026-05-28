package interview.guide.modules.llmprovider.controller;

import interview.guide.common.annotation.RateLimit;
import interview.guide.common.result.Result;
import interview.guide.modules.llmprovider.dto.*;
import interview.guide.modules.llmprovider.service.LlmProviderConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/llm-provider")
@RequiredArgsConstructor
public class LlmProviderController {

    private final LlmProviderConfigService configService;

    @GetMapping("/list")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 30)
    public Result<List<ProviderDTO>> listProviders() {
        return Result.success(configService.listProviders());
    }

    @GetMapping("/{id}")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 30)
    public Result<ProviderDTO> getProvider(@PathVariable String id) {
        return Result.success(configService.getProvider(id));
    }

    @PostMapping
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 5)
    public Result<Void> createProvider(@RequestBody @Valid CreateProviderRequest request) {
        configService.createProvider(request);
        return Result.success();
    }

    @PutMapping("/{id}")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 5)
    public Result<Void> updateProvider(@PathVariable String id,
                                       @RequestBody UpdateProviderRequest request) {
        configService.updateProvider(id, request);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 5)
    public Result<Void> deleteProvider(@PathVariable String id) {
        configService.deleteProvider(id);
        return Result.success();
    }

    @PostMapping("/{id}/test")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 10)
    public Result<ProviderTestResult> testProvider(@PathVariable String id) {
        return Result.success(configService.testProvider(id));
    }

    @PostMapping("/reload")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 5)
    public Result<Void> reloadProviders() {
        configService.reloadProviders();
        return Result.success();
    }

    @GetMapping("/default-provider")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 30)
    public Result<DefaultProviderDTO> getDefaultProvider() {
        return Result.success(configService.getDefaultProvider());
    }

    @PutMapping("/default-provider")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 5)
    public Result<Void> updateDefaultProvider(@RequestBody DefaultProviderDTO request) {
        configService.updateDefaultProvider(request);
        return Result.success();
    }

    @PutMapping("/default-embedding-provider")
    @RateLimit(dimensions = RateLimit.Dimension.GLOBAL, count = 5)
    public Result<Void> updateDefaultEmbeddingProvider(@RequestBody DefaultProviderDTO request) {
        configService.updateDefaultEmbeddingProvider(request);
        return Result.success();
    }
}