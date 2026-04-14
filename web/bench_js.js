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
