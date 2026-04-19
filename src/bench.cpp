#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>
#include <chrono>
#include <Eigen/Dense>

#ifndef __EMSCRIPTEN__
#include <cstdlib>
#endif

extern "C" {
    int wasm_find_primes(int n);
    void wasm_mat_mul(const double* data, double* out, int n);
    void wasm_sort(double* data, int size);
}

int main(int argc, char** argv) {
#ifdef __EMSCRIPTEN__
    std::cout << "WASM ready.\n";
#else
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <n>\n";
        return 1;
    }
    int n = std::atoi(argv[1]);

    using clock = std::chrono::high_resolution_clock;
    using ms = std::chrono::duration<double, std::milli>;

    auto t0 = clock::now();
    int primes = wasm_find_primes(n);
    double primes_ms = ms(clock::now() - t0).count();
    std::cout << "Primes up to " << n << ": " << primes << "  (" << primes_ms << " ms)\n";

    std::vector<double> arr(n);
    for (int i = 0; i < n; ++i) arr[i] = static_cast<double>(n - i);
    t0 = clock::now();
    wasm_sort(arr.data(), n);
    double sort_ms = ms(clock::now() - t0).count();
    std::cout << "Sort " << n << " elements done. arr[0]=" << arr[0] << "  (" << sort_ms << " ms)\n";

    std::vector<double> mat(static_cast<size_t>(n) * n, 1.0);
    std::vector<double> out(static_cast<size_t>(n) * n);
    t0 = clock::now();
    wasm_mat_mul(mat.data(), out.data(), n);
    double matmul_ms = ms(clock::now() - t0).count();
    std::cout << "Mat mul " << n << "x" << n << " done. out[0]=" << out[0] << "  (" << matmul_ms << " ms)\n";


#endif

    return 0;
}

extern "C" {
    // Returns the count of primes found up to and including n.
    int wasm_find_primes(int n) {
        std::vector<bool> p(n + 1, true);
        p[0] = p[1] = false;
        for (int i = 2; i <= static_cast<int>(std::sqrt(n)); ++i)
            if (p[i])
                for (int j = i * i; j <= n; j += i)
                    p[j] = false;
        return static_cast<int>(std::count(p.begin(), p.end(), true));
    }

    // Multiplies the n×n row-major matrix A by itself, writing the result into out.
    // noalias() tells Eigen the buffers don't overlap, so it writes directly into out.
    void wasm_mat_mul(const double* data, double* out, int n) {
        using RowMat = Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic, Eigen::RowMajor>;
        Eigen::Map<const RowMat> A(data, n, n);
        Eigen::Map<RowMat> C(out, n, n);
        C.noalias() = A * A;
    }

    // Sorts the array of doubles in-place (ascending).
    void wasm_sort(double* data, int size) {
        std::sort(data, data + size);
    }
}
