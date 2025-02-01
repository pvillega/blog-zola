FROM alpine:3.18 as builder

# Install git and zola
RUN apk add --no-cache git zola

WORKDIR /project

# Copy repository files and update submodules
COPY . .
RUN git init && \
    git submodule init && \
    git submodule update

# Build the site
RUN ["zola", "build"]

FROM ghcr.io/static-web-server/static-web-server:2
WORKDIR /
COPY --from=builder /project/public /public
