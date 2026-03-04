# 构建阶段
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /workspace

# 复制 POM 文件（利用 Docker 缓存层）
COPY pom.xml .
COPY app/pom.xml app/

# 下载依赖（利用 Docker 缓存）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY app/src ./app/src

# 构建应用
RUN mvn package -DskipTests -B

# 运行阶段
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 复制构建产物
COPY --from=builder /workspace/app/target/*.jar app.jar

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
