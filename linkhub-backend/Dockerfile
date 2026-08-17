# --- build stage ---
FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/seed ./cmd/seed

# --- runtime stage ---
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=build /bin/api /bin/api
COPY --from=build /bin/seed /bin/seed
EXPOSE 8080
CMD ["/bin/api"]
