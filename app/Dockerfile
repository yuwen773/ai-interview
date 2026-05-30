# ==============================================================================
# 第一阶段：构建环境 (Builder Stage)
# 作用：使用包含 Maven 和 JDK 的完整镜像来编译源代码
# ==============================================================================
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /workspace

# 1. 优先复制 pom.xml 文件
# 技巧：利用 Docker 缓存层机制。只要 pom.xml 不变，这一层就会被缓存，
# 从而跳过耗时的依赖下载步骤。
COPY app/pom.xml app/

# 2. 预下载依赖 (Dependency Resolution)
# 作用：利用 Docker 缓存层预先下载依赖。只要 pom.xml 配置不变，这一层就会被缓存。
# -o, --offline: 离线模式，如果依赖已经在本地仓库则不下载
# || true: 兜底策略，即使预下载失败也不要打断构建
RUN mvn dependency:go-offline -DskipTests || true

# 3. 复制源代码
COPY app/src app/src

# 4. 执行构建
# spring-boot:repackage 会将依赖 JAR 打包进单一的 fat JAR
RUN mvn -f app/pom.xml package -DskipTests

# ==============================================================================
# 第二阶段：运行环境 (Runtime Stage)
# 作用：使用轻量级的 JRE 镜像来运行编译好的 JAR 包
# 技巧：多阶段构建 (Multi-stage build) 可以显著减小最终镜像的体积
# ==============================================================================
FROM eclipse-temurin:21-jre
WORKDIR /app

# 从第一阶段 (builder) 中复制生成的 JAR 文件到当前镜像
# 只复制构建产物，不复制源代码和 Maven 仓库，保持镜像干净
COPY --from=builder /workspace/app/target/*.jar app.jar

# 声明容器将暴露的端口（仅作为文档说明，实际映射需在 docker-compose 中配置）
EXPOSE 8080

# 容器启动时执行的命令
ENTRYPOINT ["java", "-jar", "app.jar"]