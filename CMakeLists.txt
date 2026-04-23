cmake_minimum_required(VERSION 3.15)
project(hello_wasm LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

option(WITH_OPENCV "Build bench_opencv with OpenCV via Gaussian blur demo (Emscripten only)" OFF)

add_executable(hello_wasm src/hello.cpp)

add_executable(bench_wasm src/bench.cpp)
target_include_directories(bench_wasm PRIVATE include /usr/include/eigen3)

if(EMSCRIPTEN)
    # Maximum optimization for all Emscripten targets
    # -O3           : highest compiler optimisation level
    # -flto         : link-time optimisation (inlines across TUs)
    # --closure 1   : minify the JS glue with the Closure Compiler
    # -msimd128     : enable WebAssembly SIMD128
    add_compile_options(-O3 -flto -msimd128)
    add_link_options(-O3 -flto --closure 1 -msimd128)

    target_link_options(bench_wasm PRIVATE
        "SHELL:-s EXPORTED_FUNCTIONS=['_main','_wasm_find_primes','_wasm_mat_mul','_wasm_sort','_wasm_hashmap_insert','_wasm_fibonacci','_wasm_mandelbrot','_malloc','_free']"
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
            "${CMAKE_BINARY_DIR}/bench_wasm.js"
            "${CMAKE_SOURCE_DIR}/web/wasm/bench_wasm.js"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/bench_wasm.wasm"
            "${CMAKE_SOURCE_DIR}/web/wasm/bench_wasm.wasm"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/hello_wasm.js"
            "${CMAKE_SOURCE_DIR}/web/wasm/hello_wasm.js"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/hello_wasm.wasm"
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

# --- OpenCV ---
if(EMSCRIPTEN AND WITH_OPENCV)
    message(STATUS "Building OpenCV from source for Emscripten")
    include(FetchContent)

    FetchContent_Declare(
        opencv
        GIT_REPOSITORY https://github.com/opencv/opencv.git
        GIT_TAG        4.12.0
    )

    set(BUILD_LIST "core,imgproc" CACHE STRING "" FORCE)
    set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
    set(WITH_IPP OFF CACHE BOOL "" FORCE)
    set(BUILD_TESTS OFF CACHE BOOL "" FORCE)
    set(BUILD_PERF_AATESTS OFF CACHE BOOL "" FORCE)
    set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
    set(BUILD_opencv_apps OFF CACHE BOOL "" FORCE)
    set(WITH_PTHREADS_PF OFF CACHE BOOL "" FORCE)

    FetchContent_MakeAvailable(opencv)

    # find_package can't be used here: OpenCVConfig.cmake is a build artifact
    # that doesn't exist at configure time. Use the targets directly and supply
    # include paths manually:
    #   - module public headers are under <src>/modules/<name>/include/
    #   - generated headers (opencv_modules.hpp, cvconfig.h) land in <binary_dir>/opencv2/
    #     which means they are reached via ${CMAKE_BINARY_DIR}
    add_executable(bench_opencv src/bench_opencv.cpp)
    set_target_properties(bench_opencv PROPERTIES
        SUFFIX ".js"
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/wasm"
    )
    target_link_options(bench_opencv PRIVATE
        "SHELL:-s EXPORTED_FUNCTIONS=['_wasm_gaussian_blur','_malloc','_free']"
        "SHELL:-s EXPORTED_RUNTIME_METHODS=['HEAPU8']"
        "SHELL:-s NO_EXIT_RUNTIME=1"
        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
        "SHELL:-s MODULARIZE=1"
        "SHELL:-s EXPORT_NAME='BenchOpenCV'"
    )
    target_include_directories(bench_opencv PRIVATE
        ${opencv_SOURCE_DIR}/include
        ${opencv_SOURCE_DIR}/modules/core/include
        ${opencv_SOURCE_DIR}/modules/imgproc/include
        ${CMAKE_BINARY_DIR}
    )
    target_link_libraries(bench_opencv PRIVATE opencv_core opencv_imgproc)

    add_custom_target(copy_opencv ALL
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/wasm/bench_opencv.js"
            "${CMAKE_SOURCE_DIR}/web/wasm/bench_opencv.js"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_BINARY_DIR}/wasm/bench_opencv.wasm"
            "${CMAKE_SOURCE_DIR}/web/wasm/bench_opencv.wasm"
        COMMAND ${CMAKE_COMMAND} -E echo
            "-- OpenCV WASM artifacts copied to ${CMAKE_SOURCE_DIR}/web/wasm/"
        DEPENDS bench_opencv
        COMMENT "Copying OpenCV WASM artifacts to web/wasm/"
    )
endif()