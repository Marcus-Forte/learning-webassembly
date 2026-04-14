#include <iostream>

#if defined(__EMSCRIPTEN__)
#include <emscripten.h>

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    int add(int a, int b) {
        return a + b;
    }
}
#endif

int main() {
    std::cout << "Hello from C++, WebAssembly!" << std::endl;
}

