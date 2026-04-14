# learning-webassembly

A C++ project compiled to WebAssembly with [Emscripten](https://emscripten.org/), featuring a benchmark that compares C++/WASM against equivalent JavaScript implementations.

## Prerequisites

- [Docker](https://www.docker.com/) and [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)

Open the project in VS Code and select **Reopen in Container** when prompted. The dev container is built from `mdnf1992/cpp-dev` with the Emscripten SDK and [Eigen](https://eigen.tuxfamily.org/) included.

## Targets

| Target | Description |
|---|---|
| `hello_wasm` | Hello-world demo. Exports a C++ `add(a, b)` function callable from JS. |
| `bench_wasm` | Benchmark suite. Exports `wasm_find_primes`, `wasm_mat_mul` (via Eigen), and `wasm_sort`. |

## Build

CMake presets are defined in `CMakePresets.json`.

### WebAssembly (Emscripten)

```bash
cmake --preset wasm-release
cmake --build build
```

Built with `-O3 -flto --closure 1 -msimd128` for maximum performance. Output JS glue and `.wasm` binaries are placed in `build/wasm/` and **automatically copied to `web/wasm/`** by the `copy_wasm` build target.

Available presets: `wasm-release`, `wasm-debug`

### Native (host compiler)

```bash
cmake --preset native-release
cmake --build build_native
```

Available presets: `native-release`, `native-debug`

The native `bench_wasm` binary accepts an `<n>` argument:

```bash
build_native/bench_wasm 1000
```

## Run in the browser

1. Serve over HTTP (browsers block `.wasm` fetches over `file://`):
   ```bash
   cd web && uv run python -m http.server 8080
   ```
   Or use the **Serve web** VS Code task.

2. Open the pages in your browser:
   - [http://localhost:8080](http://localhost:8080) — C++ vs JS benchmark
   - [http://localhost:8080/hello_index.html](http://localhost:8080/hello_index.html) — Hello WASM demo

> If using VS Code Dev Containers, check the **Ports** tab to find the forwarded address for port 8080.
