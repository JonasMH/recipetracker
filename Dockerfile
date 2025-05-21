FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache git

COPY ./bin/ ./
RUN chmod +x /app/recipetracker

CMD ["/app/recipetracker"]