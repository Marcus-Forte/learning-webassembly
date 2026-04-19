/* ── JS implementation ───────────────────────────────────────────── */

function jsFindPrimes(n) {
    const sieve = new Uint8Array(n + 1);
    sieve.fill(1);
    sieve[0] = sieve[1] = 0;
    for (let i = 2; i <= Math.sqrt(n); i++)
        if (sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = 0;
    let count = 0;
    for (let i = 0; i <= n; i++) if (sieve[i]) count++;
    return count;
}

function getInputN(id) {
    return parseInt(document.getElementById(id).value, 10);
}

// math.js matrix multiply: A × A (row-major input), writes result into out (Float64Array).
function jsMatMul(data, out, n) {
    const A = math.reshape(math.matrix(Array.from(data)), [n, n]);
    const C = math.multiply(A, A);
    const flat = math.flatten(C).toArray();
    out.set(flat);
}

/* ── Shared state for mat_mul (filled on Init) ───────────────────── */

let g_matmul_data = null;
let g_matmul_n = 0;

/* ── Shared state for sort (filled on Init) ──────────────────────── */

let g_sort_shared = null;    // shared random data, same input for JS and C++
let g_sort_work = null;        // working copy restored before each timed run
let g_sort_n = 0;

/* ── Button handlers ─────────────────────────────────────────────── */

document.getElementById('js-primes').addEventListener('click', () => {
    const n = getInputN('input-primes-n');
    const t0 = performance.now();
    const count = jsFindPrimes(n);
    const ms = (performance.now() - t0).toFixed(2);
    document.getElementById('res-js-primes').textContent = ms + ' ms';
    console.log(`[JS] find_primes(${n.toLocaleString()}): ${count} primes in ${ms} ms`);
});

document.getElementById('js-matmul').addEventListener('click', () => {
    const n = g_matmul_n;
    const out = new Float64Array(n * n);
    const t0 = performance.now();
    jsMatMul(g_matmul_data, out, n);
    const ms = (performance.now() - t0).toFixed(2);
    document.getElementById('res-js-matmul').textContent = ms + ' ms';
    console.log(`[JS] mat_mul(${n}×${n}): out[0]=${out[0].toFixed(6)}  out[last]=${out[n*n-1].toFixed(6)} in ${ms} ms`);
});

document.getElementById('js-sort').addEventListener('click', () => {
    g_sort_work.set(g_sort_shared);   // restore shared order (not timed)
    const t0 = performance.now();
    g_sort_work.sort((a, b) => a - b);
    const ms = (performance.now() - t0).toFixed(2);
    document.getElementById('res-js-sort').textContent = ms + ' ms';
    console.log(`[JS] sort(${g_sort_n.toLocaleString()}): first=${g_sort_work[0].toFixed(6)} last=${g_sort_work[g_sort_n-1].toFixed(6)} in ${ms} ms`);
});

document.getElementById('js-hashmap').addEventListener('click', () => {
    const n = getInputN('input-hashmap-n');
    const t0 = performance.now();
    const m = new Map();
    for (let i = 0; i < n; i++) m.set(i, i * 2);
    const elapsed = (performance.now() - t0).toFixed(2);
    document.getElementById('res-js-hashmap').textContent = elapsed + ' ms';
    console.log(`[JS] hashmap_insert(${n.toLocaleString()}): size=${m.size} in ${elapsed} ms`);
});

document.getElementById('js-fib').addEventListener('click', () => {
    const n = getInputN('input-fib-n');
    const t0 = performance.now();
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; }
    const result = n <= 1 ? n : b;
    const elapsed = (performance.now() - t0).toFixed(2);
    document.getElementById('res-js-fib').textContent = elapsed + ' ms';
    console.log(`[JS] fibonacci(${n.toLocaleString()}) = ${result} in ${elapsed} ms`);
});

document.getElementById('js-mandelbrot').addEventListener('click', () => {
    const size = getInputN('input-mandelbrot-size');
    const maxIter = getInputN('input-mandelbrot-iters');
    const t0 = performance.now();
    let total = 0;
    for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
            const x0 = (px / size) * 3.5 - 2.5;
            const y0 = (py / size) * 2.0 - 1.0;
            let x = 0, y = 0, iter = 0;
            while (x * x + y * y <= 4.0 && iter < maxIter) {
                const xt = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xt;
                iter++;
            }
            total += iter;
        }
    }
    const elapsed = (performance.now() - t0).toFixed(2);
    document.getElementById('res-js-mandelbrot').textContent = elapsed + ' ms';
    console.log(`[JS] mandelbrot(${size}x${size}, ${maxIter}): total=${total} in ${elapsed} ms`);
});
