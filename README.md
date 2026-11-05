# LabLoop Web

A simple Java/Spring Boot laboratory equipment manager with an attractive browser interface. Locally it runs with an in-memory database; Render injects `DATABASE_URL` for PostgreSQL automatically.

## Run
`mvn spring-boot:run` then open `http://localhost:8080`.

## Deploy
Push this folder to a public GitHub repository. In Render, use the Blueprint flow and select `render.yaml`; it creates the web service and PostgreSQL database.
