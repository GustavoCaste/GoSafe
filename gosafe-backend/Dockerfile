# Imagem de produção da API (Render). Configuração só por variáveis de ambiente:
# SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, GOSAFE_JWT_SECRET.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q -DskipTests package && cp target/gosafe-backend-*.jar /app/app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
# O plano gratuito do Render tem 512 MB; o Render informa a porta em PORT.
CMD ["sh", "-c", "exec java -Xmx350m -Xss512k -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Dserver.port=${PORT:-8080} -jar app.jar"]
