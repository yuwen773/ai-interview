package interview.guide.modules.resume;

import interview.guide.common.annotation.RateLimit;
import interview.guide.common.result.Result;
import interview.guide.infrastructure.file.DocumentPreviewService;
import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.file.PreviewContent;
import interview.guide.infrastructure.file.PreviewMetaDTO;
import interview.guide.infrastructure.file.TextPreviewDTO;
import interview.guide.modules.resume.model.ResumeDetailDTO;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.model.ResumeListItemDTO;
import interview.guide.modules.resume.service.ResumeDeleteService;
import interview.guide.modules.resume.service.ResumeHistoryService;
import interview.guide.modules.resume.service.ResumeUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * 简历控制器
 * Resume Controller for upload and analysis
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeUploadService uploadService;
    private final ResumeDeleteService deleteService;
    private final ResumeHistoryService historyService;
    private final DocumentPreviewService previewService;
    private final FileStorageService fileStorageService;

    /**
     * 上传简历并获取分析结果
     *
     * @param file 简历文件（支持PDF、DOCX、DOC、TXT、MD等）
     * @return 简历分析结果，包含评分和建议
     */
    @PostMapping(value = "/api/resumes/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL, RateLimit.Dimension.IP}, count = 5)
    public Result<Map<String, Object>> uploadAndAnalyze(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = uploadService.uploadAndAnalyze(file);
        boolean isDuplicate = (Boolean) result.get("duplicate");
        if (isDuplicate) {
            return Result.success("检测到相同简历，已返回历史分析结果", result);
        }
        return Result.success(result);
    }

    /**
     * 获取所有简历列表
     */
    @GetMapping("/api/resumes")
    public Result<List<ResumeListItemDTO>> getAllResumes() {
        List<ResumeListItemDTO> resumes = historyService.getAllResumes();
        return Result.success(resumes);
    }

    /**
     * 获取简历详情（包含分析历史）
     */
    @GetMapping("/api/resumes/{id}/detail")
    public Result<ResumeDetailDTO> getResumeDetail(@PathVariable("id") Long id) {
        ResumeDetailDTO detail = historyService.getResumeDetail(id);
        return Result.success(detail);
    }

    /**
     * 获取简历预览元数据
     */
    @GetMapping("/api/resumes/{id}/preview-meta")
    public Result<PreviewMetaDTO> getResumePreviewMeta(@PathVariable("id") Long id) {
        return Result.success(previewService.buildResumePreviewMeta(id));
    }

    /**
     * 获取简历文本预览
     */
    @GetMapping("/api/resumes/{id}/preview/text")
    public Result<TextPreviewDTO> getResumeTextPreview(@PathVariable("id") Long id) {
        return Result.success(previewService.loadResumeTextPreview(id));
    }

    /**
     * 获取简历预览 PDF 内容
     */
    @GetMapping("/api/resumes/{id}/preview/content")
    public ResponseEntity<byte[]> getResumePreviewContent(@PathVariable("id") Long id) {
        PreviewContent previewContent = previewService.loadResumePreviewContent(id);
        String filename = encodeFilename(previewContent.filename());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + filename)
            .contentType(MediaType.APPLICATION_PDF)
            .body(previewContent.content());
    }

    /**
     * 导出简历分析报告为PDF
     */
    @GetMapping("/api/resumes/{id}/export")
    public ResponseEntity<byte[]> exportAnalysisPdf(@PathVariable("id") Long id) {
        try {
            var result = historyService.exportAnalysisPdf(id);
            String filename = URLEncoder.encode(result.filename(), StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(result.pdfBytes());
        } catch (Exception e) {
            log.error("Export PDF failed: resumeId={}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 下载原始简历文件
     */
    @GetMapping("/api/resumes/{id}/download")
    public ResponseEntity<byte[]> downloadResumeFile(@PathVariable("id") Long id) {
        ResumeEntity resume = historyService.getResumeEntity(id);
        String storageKey = resume.getStorageKey();
        byte[] fileContent = fileStorageService.downloadFile(storageKey);
        String filename = encodeFilename(resume.getOriginalFilename());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + filename)
            .contentType(resolveMediaType(resume.getContentType()))
            .body(fileContent);
    }

    /**
     * 删除简历
     *
     * @param id 简历ID
     * @return 删除结果
     */
    @DeleteMapping("/api/resumes/{id}")
    public Result<Void> deleteResume(@PathVariable("id") Long id) {
        deleteService.deleteResume(id);
        return Result.success(null);
    }

    /**
     * 重新分析简历（手动重试）
     * 用于分析失败后的重试
     *
     * @param id 简历ID
     * @return 结果
     */
    @PostMapping("/api/resumes/{id}/reanalyze")
    @RateLimit(dimensions = {RateLimit.Dimension.GLOBAL, RateLimit.Dimension.IP}, count = 2)
    public Result<Void> reanalyze(@PathVariable("id") Long id) {
        uploadService.reanalyze(id);
        return Result.success(null);
    }

    /**
     * 健康检查接口
     */
    @GetMapping("/api/resumes/health")
    public Result<Map<String, String>> health() {
        return Result.success(Map.of(
            "status", "UP",
            "service", "AI Interview Platform - Resume Service"
        ));
    }

    private String encodeFilename(String filename) {
        return URLEncoder.encode(filename == null ? "resume" : filename, StandardCharsets.UTF_8)
            .replace("+", "%20");
    }

    private MediaType resolveMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (IllegalArgumentException exception) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}