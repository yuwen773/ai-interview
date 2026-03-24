package interview.guide.modules.resume;

import interview.guide.infrastructure.file.DocumentPreviewService;
import interview.guide.infrastructure.file.FileStorageService;
import interview.guide.infrastructure.file.PreviewContent;
import interview.guide.infrastructure.file.PreviewMetaDTO;
import interview.guide.infrastructure.file.TextPreviewDTO;
import interview.guide.modules.resume.model.ResumeEntity;
import interview.guide.modules.resume.service.ResumeDeleteService;
import interview.guide.modules.resume.service.ResumeHistoryService;
import interview.guide.modules.resume.service.ResumeUploadService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ResumeController.class)
class ResumePreviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DocumentPreviewService documentPreviewService;

    @MockitoBean
    private FileStorageService fileStorageService;

    @MockitoBean
    private ResumeUploadService resumeUploadService;

    @MockitoBean
    private ResumeDeleteService resumeDeleteService;

    @MockitoBean
    private ResumeHistoryService resumeHistoryService;

    @Test
    void shouldReturnResumePreviewMeta() throws Exception {
        when(documentPreviewService.buildResumePreviewMeta(7L)).thenReturn(new PreviewMetaDTO(
            "RESUME",
            7L,
            "candidate-resume.pdf",
            "application/pdf",
            "pdf",
            true,
            "/api/resumes/7/preview/content",
            null,
            "/api/resumes/7/download",
            null
        ));

        mockMvc.perform(get("/api/resumes/7/preview-meta"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.sourceType").value("RESUME"))
            .andExpect(jsonPath("$.data.sourceId").value(7))
            .andExpect(jsonPath("$.data.previewType").value("pdf"))
            .andExpect(jsonPath("$.data.supported").value(true))
            .andExpect(jsonPath("$.data.previewUrl").value("/api/resumes/7/preview/content"))
            .andExpect(jsonPath("$.data.downloadUrl").value("/api/resumes/7/download"));
    }

    @Test
    void shouldReturnInlinePdfPreviewContent() throws Exception {
        byte[] pdfBytes = "%PDF-1.4".getBytes(StandardCharsets.UTF_8);
        when(documentPreviewService.loadResumePreviewContent(7L)).thenReturn(
            new PreviewContent("candidate-resume.pdf", "application/pdf", pdfBytes)
        );

        mockMvc.perform(get("/api/resumes/7/preview/content"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                containsString("inline; filename*=UTF-8''candidate-resume.pdf")))
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
            .andExpect(content().bytes(pdfBytes));
    }

    @Test
    void shouldReturnResumeTextPreview() throws Exception {
        when(documentPreviewService.loadResumeTextPreview(7L)).thenReturn(new TextPreviewDTO(
            "candidate-resume.txt",
            "text/plain",
            "hello resume",
            false
        ));

        mockMvc.perform(get("/api/resumes/7/preview/text"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.filename").value("candidate-resume.txt"))
            .andExpect(jsonPath("$.data.text").value("hello resume"))
            .andExpect(jsonPath("$.data.truncated").value(false));
    }

    @Test
    void shouldDownloadOriginalResumeFile() throws Exception {
        byte[] fileBytes = "resume file bytes".getBytes(StandardCharsets.UTF_8);
        ResumeEntity entity = new ResumeEntity();
        entity.setId(7L);
        entity.setOriginalFilename("candidate-resume.docx");
        entity.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        entity.setStorageKey("resumes/2026/03/24/sample_candidate-resume.docx");

        when(resumeHistoryService.getResumeEntity(7L)).thenReturn(entity);
        when(fileStorageService.downloadFile(entity.getStorageKey())).thenReturn(fileBytes);

        mockMvc.perform(get("/api/resumes/7/download"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                containsString("attachment; filename*=UTF-8''candidate-resume.docx")))
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
            .andExpect(content().bytes(fileBytes));

        verify(resumeHistoryService).getResumeEntity(7L);
        verify(fileStorageService).downloadFile(entity.getStorageKey());
        verify(documentPreviewService, never()).loadResumePreviewContent(anyLong());
    }
}