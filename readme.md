# learning-webassembly

A minimal C++ project compiled to WebAssembly with [Emscripten](https://emscripten.org/).

## Prerequisites

- [Docker](https://www.docker.com/) and [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)

Open the project in VS Code and select **Reopen in Container** when prompted. The dev container is built from `mdnf1992/cpp-dev` with the Emscripten SDK included.

## Build

```bash
mkdir -p build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake
make
```

Output files are placed in `build/wasm/`:
- `hello_wasm.js` — Emscripten JS glue
- `hello_wasm.wasm` — WebAssembly binary

## Run in the browser

1. Copy the build artifacts to the web directory:
   ```bash
   cp build/wasm/hello_wasm.js build/wasm/hello_wasm.wasm web/
   ```

2. Serve over HTTP (browsers block `.wasm` fetches over `file://`):
   ```bash
   cd web && uv run python -m http.server 8080
   ```

3. Open [http://localhost:8080](http://localhost:8080) in your browser.

> If using VS Code Dev Containers, check the **Ports** tab to find the forwarded address for port 8080.
