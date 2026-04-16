package interview.guide.modules.dashboard;

import interview.guide.common.result.Result;
import interview.guide.modules.dashboard.model.DashboardSummaryDTO;
import interview.guide.modules.dashboard.service.DashboardSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 仪表盘控制器
 * 提供系统概览数据接口
 */
@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardSummaryService dashboardSummaryService;

    /**
     * 获取仪表盘汇总数据
     *
     * @return 包含简历数量、面试统计和最新记录的汇总信息
     */
    @GetMapping("/api/dashboard/summary")
    public Result<DashboardSummaryDTO> getSummary() {
        return Result.success(dashboardSummaryService.getSummary());
    }
}
