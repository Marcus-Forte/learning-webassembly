FROM mdnf1992/cpp-dev:latest

# Install Emscripten SDK dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Emscripten SDK
ENV EMSDK=/emsdk
RUN git clone --depth 1 https://github.com/emscripten-core/emsdk.git "${EMSDK}" \
    && cd "${EMSDK}" \
    && ./emsdk install latest \
    && ./emsdk activate latest

# Make Emscripten tools available on PATH
ENV PATH="${EMSDK}:${EMSDK}/upstream/emscripten:${PATH}"

# Verify installation
RUN emcc --version
