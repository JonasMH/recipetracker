FROM alpine:3.21

WORKDIR /app

COPY ./bin/ ./
RUN chmod +x /app/recipetracker

CMD ["/app/recipetracker"]