#include <cstdint>
#include <cstring>
#include <chrono>
#include <iostream>
#include <opencv2/imgproc.hpp>

extern "C" {

// Applies Gaussian blur to RGBA pixel data in-place.
// data:  pointer to width * height * 4 bytes (RGBA)
// ksize: blur kernel size at full resolution — must be odd and >= 1
// scale: downscale factor before blurring (0 < scale <= 1).
//        The kernel shrinks proportionally so perceived blur radius is preserved.
void wasm_gaussian_blur(uint8_t* data, int width, int height, int ksize, float scale) {
    if (scale <= 0.0f || scale > 1.0f) scale = 1.0f;
    if (ksize < 1) ksize = 1;
    if (ksize % 2 == 0) ksize++;

    cv::Mat src(height, width, CV_8UC4, data);

    const auto t0 = std::chrono::high_resolution_clock::now();

    // Downscale
    cv::Mat small;
    if (scale < 1.0f)
        cv::resize(src, small, cv::Size(), scale, scale, cv::INTER_LINEAR);
    else
        small = src;

    // Scale kernel proportionally, keep odd and >= 1
    int small_ksize = std::max(1, static_cast<int>(ksize * scale));
    if (small_ksize % 2 == 0) small_ksize++;

    cv::Mat blurred;
    cv::GaussianBlur(small, blurred, cv::Size(small_ksize, small_ksize), 0);

    // Upscale back to original size
    cv::Mat dst;
    if (scale < 1.0f)
        cv::resize(blurred, dst, cv::Size(width, height), 0, 0, cv::INTER_LINEAR);
    else
        dst = blurred;

    const auto t1 = std::chrono::high_resolution_clock::now();
    const double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
    std::cout << "GaussianBlur ksize=" << ksize << " small_ksize=" << small_ksize
              << " scale=" << scale << " size=" << width << "x" << height
              << " time=" << ms << "ms\n";

    std::memcpy(data, dst.data, static_cast<size_t>(width) * height * 4);
}


} // extern "C"
