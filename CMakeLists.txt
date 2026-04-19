cmake_minimum_required(VERSION 3.15)
project(hello_wasm LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(hello_wasm src/main.cpp)
target_include_directories(hello_wasm PRIVATE include)

add_executable(bench_wasm src/bench.cpp)
target_include_directories(bench_wasm PRIVATE include /usr/include/eigen3)

if(EMSCRIPTEN)
    # Maximum optimization for all Emscripten targets
    # -O3           : highest compiler optimisation level
    # -flto         : link-time optimisation (inlines across TUs)
    # --closure 1   : minify the JS glue with the Closure Compiler
    # -msimd128     : enable WebAssembly SIMD128 (allows Eigen to auto-vectorise)
    add_compile_options(-O3 -flto -msimd128)
    add_link_options(-O3 -flto --closure 1 -msimd128)

    set_target_properties(hello_wasm PROPERTIES
        SUFFIX ".js"
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/wasm"
    )
    set_target_properties(bench_wasm PROPERTIES
        SUFFIX ".js"
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/wasm"
    )
    target_link_options(bench_wasm PRIVATE
        "SHELL:-s EXPORTED_FUNCTIONS=['_main','_wasm_find_primes','_wasm_mat_mul','_wasm_sort','_malloc','_free']"
        "SHELL:-s EXPORTED_RUNTIME_METHODS=['ccall','HEAPF64']"
        "SHELL:-s NO_EXIT_RUNTIME=1"
        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
    )
    target_link_options(hello_wasm PRIVATE
        "SHELL:-s EXPORTED_FUNCTIONS=['_main','_add']"
        "SHELL:-s EXPORTED_RUNTIME_METHODS=['ccall']"
        "SHELL:-s NO_EXIT_RUNTIME=1"
    )

    # Always copy WASM artifacts to web/wasm/
    add_custom_target(copy_wasm ALL
        COMMAND ${CMAKE_COMMAND} -E make_directory "${CMAKE_SOURCE_DIR}/web/wasm"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/wasm/bench_wasm.js"
            "${CMAKE_SOURCE_DIR}/web/wasm/bench_wasm.js"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/wasm/bench_wasm.wasm"
            "${CMAKE_SOURCE_DIR}/web/wasm/bench_wasm.wasm"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/wasm/hello_wasm.js"
            "${CMAKE_SOURCE_DIR}/web/wasm/hello_wasm.js"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/wasm/hello_wasm.wasm"
            "${CMAKE_SOURCE_DIR}/web/wasm/hello_wasm.wasm"
        COMMAND ${CMAKE_COMMAND} -E echo
            "-- WASM artifacts copied to ${CMAKE_SOURCE_DIR}/web/wasm/"
        DEPENDS bench_wasm hello_wasm
        COMMENT "Copying WASM artifacts to web/wasm/"
    )
    else()
    message(STATUS "Native build")
    # This doesn't seem to make a difference, but eigen documentation recommends.
    target_compile_options(bench_wasm PRIVATE -march=native)
endif()