package interview.guide.modules.interview.model;

import java.util.List;

/**
 * 面试岗位枚举
 */
public enum JobRole {
    JAVA_BACKEND(
        "JAVA_BACKEND",
        "Java 后端",
        "面向 Java 后端开发岗位，重点考察 Java、数据库、中间件与 Spring 技术栈。",
        List.of("Java", "Spring Boot", "MySQL", "Redis", "并发", "微服务")
    ),
    WEB_FRONTEND(
        "WEB_FRONTEND",
        "Web 前端",
        "面向 Web 前端开发岗位，重点考察 JavaScript/TypeScript、浏览器、React 与工程化能力。",
        List.of("JavaScript", "TypeScript", "React", "浏览器", "CSS", "前端工程化")
    ),
    PYTHON_ALGORITHM(
        "PYTHON_ALGORITHM",
        "Python 算法",
        "面向 Python 算法岗位，重点考察 Python 语言能力、数据结构算法、复杂度分析与工程实现。",
        List.of("Python", "算法", "数据结构", "动态规划", "复杂度分析", "工程实现")
    );

    private final String code;
    private final String label;
    private final String description;
    private final List<String> techKeywords;

    JobRole(String code, String label, String description, List<String> techKeywords) {
        this.code = code;
        this.label = label;
        this.description = description;
        this.techKeywords = List.copyOf(techKeywords);
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    public List<String> getTechKeywords() {
        return techKeywords;
    }
}
