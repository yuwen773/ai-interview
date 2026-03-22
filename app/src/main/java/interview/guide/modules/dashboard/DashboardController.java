package interview.guide.modules.dashboard;

import interview.guide.common.result.Result;
import interview.guide.modules.dashboard.model.DashboardSummaryDTO;
import interview.guide.modules.dashboard.service.DashboardSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardSummaryService dashboardSummaryService;

    @GetMapping("/api/dashboard/summary")
    public Result<DashboardSummaryDTO> getSummary() {
        return Result.success(dashboardSummaryService.getSummary());
    }
}
