/* ── C++ / WASM module glue ──────────────────────────────────────── */

var Module = {
    print: function(text) { console.log(text); },
    onRuntimeInitialized: function() {
        let g_wasm_ptr = 0;       // mat_mul input WASM heap pointer
        let g_wasm_out_ptr = 0;   // mat_mul output WASM heap pointer
        let g_sort_wasm_ptr = 0;  // sort WASM heap pointer

        // find_primes
        const primesBtn = document.getElementById('cpp-primes');
        primesBtn.disabled = false;
        primesBtn.addEventListener('click', () => {
            const n = parseInt(document.getElementById('input-primes-n').value, 10);
            const t0 = performance.now();
            const count = Module._wasm_find_primes(n);
            const ms = (performance.now() - t0).toFixed(2);
            document.getElementById('res-cpp-primes').textContent = ms + ' ms';
            console.log(`[C++] find_primes(${n.toLocaleString()}): ${count} primes in ${ms} ms`);
        });

        // mat_mul — Init button allocates shared data; run buttons reuse it
        const initBtn  = document.getElementById('init-matmul');
        const matJsBtn = document.getElementById('js-matmul');
        const matCppBtn = document.getElementById('cpp-matmul');

        initBtn.addEventListener('click', () => {
            const n = parseInt(document.getElementById('input-matmul-n').value, 10);
            const nElems = n * n;
            // Free previous WASM heap allocations
            if (g_wasm_ptr) { Module._free(g_wasm_ptr); g_wasm_ptr = 0; }
            if (g_wasm_out_ptr) { Module._free(g_wasm_out_ptr); g_wasm_out_ptr = 0; }
            // Allocate and fill input with random data
            const data = new Float64Array(nElems);
            for (let i = 0; i < nElems; i++) data[i] = Math.random();
            // Share with JS benchmark
            g_matmul_data = data;
            g_matmul_n = n;
            // Copy same data into WASM heap; allocate output buffer
            g_wasm_ptr = Module._malloc(nElems * 8);
            g_wasm_out_ptr = Module._malloc(nElems * 8);
            new Float64Array(Module.HEAPF64.buffer, g_wasm_ptr, nElems).set(data);
            // Enable run buttons
            matJsBtn.disabled = false;
            matCppBtn.disabled = false;
            initBtn.textContent = `Reinit (${n}×${n})`;
            console.log(`[init] ${n}×${n} matrix ready (${(nElems * 8 / 1024 / 1024).toFixed(1)} MB input + output)`);
        });

        matCppBtn.addEventListener('click', () => {
            const n = g_matmul_n;
            const t0 = performance.now();
            Module.ccall('wasm_mat_mul', null, ['number', 'number', 'number'], [g_wasm_ptr, g_wasm_out_ptr, n]);
            const ms = (performance.now() - t0).toFixed(2);
            const out = new Float64Array(Module.HEAPF64.buffer, g_wasm_out_ptr, n * n);
            document.getElementById('res-cpp-matmul').textContent = ms + ' ms';
            console.log(`[C++] mat_mul(${n}×${n}): out[0]=${out[0].toFixed(6)}  out[last]=${out[n*n-1].toFixed(6)} in ${ms} ms`);
        });

        // sort — Init allocates pristine + WASM heap; run buttons restore before timing
        const initSortBtn  = document.getElementById('init-sort');
        const sortJsBtn    = document.getElementById('js-sort');
        const sortCppBtn   = document.getElementById('cpp-sort');

        initSortBtn.addEventListener('click', () => {
            const n = parseInt(document.getElementById('input-sort-n').value, 10);
            if (g_sort_wasm_ptr) { Module._free(g_sort_wasm_ptr); g_sort_wasm_ptr = 0; }
            // Fill pristine random data
            const pristine = new Float64Array(n);
            for (let i = 0; i < n; i++) pristine[i] = Math.random();
            g_sort_shared = pristine;
            g_sort_work = new Float64Array(n);
            g_sort_n = n;
            // Allocate WASM heap (restored from pristine before each C++ run)
            g_sort_wasm_ptr = Module._malloc(n * 8);
            sortJsBtn.disabled = false;
            sortCppBtn.disabled = false;
            initSortBtn.textContent = `Reinit (${n.toLocaleString()})`;
            console.log(`[init] sort: ${n.toLocaleString()} elements ready (${(n * 8 / 1024 / 1024).toFixed(1)} MB)`);
        });

        sortCppBtn.addEventListener('click', () => {
            // Restore pristine into WASM heap (not timed)
            new Float64Array(Module.HEAPF64.buffer, g_sort_wasm_ptr, g_sort_n).set(g_sort_shared);
            const t0 = performance.now();
            Module.ccall('wasm_sort', null, ['number', 'number'], [g_sort_wasm_ptr, g_sort_n]);
            const ms = (performance.now() - t0).toFixed(2);
            const view = new Float64Array(Module.HEAPF64.buffer, g_sort_wasm_ptr, g_sort_n);
            document.getElementById('res-cpp-sort').textContent = ms + ' ms';
            console.log(`[C++] sort(${g_sort_n.toLocaleString()}): first=${view[0].toFixed(6)} last=${view[g_sort_n-1].toFixed(6)} in ${ms} ms`);
        });
    }
};
