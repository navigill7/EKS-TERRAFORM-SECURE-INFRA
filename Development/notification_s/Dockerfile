FROM eclipse-temurin:21-jdk-alpine AS build


WORKDIR /app


COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .


RUN ./mvnw dependency:go-offline -B


COPY src src


RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache curl


RUN addgroup -S spring && adduser -S spring -G spring


WORKDIR /app


COPY --from=build /app/target/notification-service-*.jar app.jar


RUN chown spring:spring app.jar


USER spring


EXPOSE 4001


HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4001/health || exit 1


ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"


ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]