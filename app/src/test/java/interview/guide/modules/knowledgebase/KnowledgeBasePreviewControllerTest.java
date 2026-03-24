package interview.guide.modules.knowledgebase;

import interview.guide.infrastructure.file.DocumentPreviewService;
import interview.guide.infrastructure.file.PreviewContent;
import interview.guide.infrastructure.file.PreviewMetaDTO;
import interview.guide.infrastructure.file.TextPreviewDTO;
import interview.guide.modules.knowledgebase.service.KnowledgeBaseDeleteService;
import interview.guide.modules.knowledgebase.service.KnowledgeBaseListService;
import interview.guide.modules.knowledgebase.service.KnowledgeBaseQueryService;
import interview.guide.modules.knowledgebase.service.KnowledgeBaseUploadService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KnowledgeBaseController.class)
class KnowledgeBasePreviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DocumentPreviewService documentPreviewService;

    @MockitoBean
    private KnowledgeBaseUploadService knowledgeBaseUploadService;

    @MockitoBean
    private KnowledgeBaseQueryService knowledgeBaseQueryService;

    @MockitoBean
    private KnowledgeBaseListService knowledgeBaseListService;

    @MockitoBean
    private KnowledgeBaseDeleteService knowledgeBaseDeleteService;

    @Test
    void shouldReturnKnowledgeBasePreviewMeta() throws Exception {
        when(documentPreviewService.buildKnowledgeBasePreviewMeta(7L)).thenReturn(new PreviewMetaDTO(
            "KNOWLEDGE_BASE",
            7L,
            "knowledge-base.pdf",
            "application/pdf",
            "pdf",
            true,
            "/api/knowledgebase/7/preview/content",
            null,
            "/api/knowledgebase/7/download",
            null
        ));

        mockMvc.perform(get("/api/knowledgebase/7/preview-meta"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.sourceType").value("KNOWLEDGE_BASE"))
            .andExpect(jsonPath("$.data.sourceId").value(7))
            .andExpect(jsonPath("$.data.previewType").value("pdf"))
            .andExpect(jsonPath("$.data.supported").value(true))
            .andExpect(jsonPath("$.data.previewUrl").value("/api/knowledgebase/7/preview/content"))
            .andExpect(jsonPath("$.data.downloadUrl").value("/api/knowledgebase/7/download"));
    }

    @Test
    void shouldReturnKnowledgeBaseInlinePdfPreviewContent() throws Exception {
        byte[] pdfBytes = "%PDF-1.4".getBytes(StandardCharsets.UTF_8);
        when(documentPreviewService.loadKnowledgeBasePreviewContent(7L)).thenReturn(
            new PreviewContent("知识库 \"预览\" \\测试.pdf", "application/pdf", pdfBytes)
        );

        mockMvc.perform(get("/api/knowledgebase/7/preview/content"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                containsString(
                    "inline; filename=\"%E7%9F%A5%E8%AF%86%E5%BA%93%20%22%E9%A2%84%E8%A7%88%22%20%5C%E6%B5%8B%E8%AF%95.pdf\"; filename*=UTF-8''%E7%9F%A5%E8%AF%86%E5%BA%93%20%22%E9%A2%84%E8%A7%88%22%20%5C%E6%B5%8B%E8%AF%95.pdf"
                )))
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
            .andExpect(content().bytes(pdfBytes));
    }

    @Test
    void shouldReturnKnowledgeBaseTextPreview() throws Exception {
        when(documentPreviewService.loadKnowledgeBaseTextPreview(7L)).thenReturn(new TextPreviewDTO(
            "knowledge-base.txt",
            "text/plain",
            "hello knowledge base",
            false
        ));

        mockMvc.perform(get("/api/knowledgebase/7/preview/text"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.filename").value("knowledge-base.txt"))
            .andExpect(jsonPath("$.data.text").value("hello knowledge base"))
            .andExpect(jsonPath("$.data.truncated").value(false));
    }
}
