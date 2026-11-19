// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(
      await _compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

let _isCompileStreamingSupported;
async function _compileStreaming(source, builtins) {
  _isCompileStreamingSupported ??= WebAssembly.compileStreaming(
    new Response(
      new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,2,23,1,14,119,97,115,109,58,106,115,45,115,116,114,105,110,103,4,99,97,115,116,0,0]),
      {headers: {'Content-Type': 'application/wasm'}},
    ),
    builtins,
  ).then(() => false, (e) => e instanceof WebAssembly.CompileError);
  if (await _isCompileStreamingSupported) {
    return WebAssembly.compileStreaming(source, builtins);
  }
  return WebAssembly.compile(await (await source).arrayBuffer(), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.screen,
      AE: (x0,x1) => x0.get(x1),
      AF: x0 => x0.changedTouches,
      AG: x0 => x0.next(),
      AH: x0 => x0.value,
      AI: (x0,x1,x2) => x0.set(x1,x2),
      AJ: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      AK: x0 => x0.vendorSub,
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: (o, p) => p in o,
      BF: x0 => x0.key,
      BG: x0 => x0.current(),
      BH: x0 => x0.selectionDirection,
      BI: x0 => x0.fontFallbackBaseUrl,
      BJ: (x0,x1) => x0.decode(x1),
      BK: x0 => x0.vendor,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: (x0,x1) => { x0.textContent = x1 },
      CF: x0 => x0.identifier,
      CG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      CH: x0 => x0.selectionStart,
      CI: (handle) => clearInterval(handle),
      CJ: x0 => x0.image,
      CK: x0 => x0.productSub,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      DF: x0 => x0.touches,
      DG: x0 => x0.v8BreakIterator,
      DH: x0 => x0.selectionEnd,
      DI: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      DJ: x0 => x0.close(),
      DK: x0 => x0.product,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: x0 => x0.activeElement,
      EE: x0 => x0.matches,
      EF: x0 => x0.pressure,
      EG: () => globalThis.Intl,
      EH: x0 => x0.value,
      EI: () => Date.now(),
      EJ: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      EK: x0 => x0.platform,
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: (x0,x1) => x0.matchMedia(x1),
      FF: x0 => x0.tiltY,
      FG: (x0,x1) => x0.segment(x1),
      FH: x0 => x0.selectionDirection,
      FI: x0 => new WeakRef(x0),
      FJ: x0 => new window.ImageDecoder(x0),
      FK: x0 => x0.languages,
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: x0 => x0.matches,
      GF: x0 => x0.tiltX,
      GG: x0 => x0.index,
      GH: x0 => x0.selectionStart,
      GI: x0 => x0.deref(),
      GJ: x0 => x0.name,
      GK: x0 => x0.language,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: x0 => x0.target,
      HE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      HF: x0 => x0.pointerType,
      HG: x0 => x0.next(),
      HH: x0 => x0.selectionEnd,
      HI: () => globalThis.WeakRef,
      HJ: x0 => x0.repetitionCount,
      HK: x0 => x0.deviceMemory,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: f => f.dartFunction,
      IF: x0 => x0.pointerId,
      IG: x0 => x0.value,
      IH: (x0,x1) => { x0.name = x1 },
      II: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      IJ: x0 => x0.frameCount,
      IK: x0 => x0.appVersion,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.clientX,
      JE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JF: x0 => x0.getCoalescedEvents(),
      JG: x0 => x0.done,
      JH: (x0,x1) => { x0.placeholder = x1 },
      JI: (a, s, e) => a.slice(s, e),
      JJ: x0 => x0.selectedTrack,
      JK: x0 => x0.appName,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      KE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      KF: s => s.trimLeft(),
      KG: (o, m, a) => o[m].apply(o, a),
      KH: (x0,x1) => { x0.autocomplete = x1 },
      KI: (o, p) => p in o,
      KJ: x0 => x0.completed,
      KK: x0 => x0.appCodeName,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      LE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      LF: s => s.toUpperCase(),
      LG: x0 => x0.iterator,
      LH: (x0,x1) => { x0.type = x1 },
      LI: x0 => x0.groups,
      LJ: x0 => x0.ready,
      LK: x0 => x0.extraAssets,
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (x0,x1) => x0.closest(x1),
      ME: (o, i) => o[i],
      MF: (x0,x1) => x0[x1],
      MG: () => globalThis.Symbol,
      MH: (x0,x1) => { x0.name = x1 },
      MI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      MJ: x0 => x0.tracks,
      MK: x0 => x0.fontManifest,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      NE: o => o.length,
      NF: x0 => x0.index,
      NG: (x0,x1) => new Intl.Segmenter(x0,x1),
      NH: (x0,x1) => { x0.placeholder = x1 },
      NI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      NJ: () => globalThis.window.ImageDecoder,
      NK: x0 => x0.assetManifest,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: (handle) => clearTimeout(handle),
      OE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      OF: x0 => x0.pop(),
      OG: x0 => x0.Segmenter,
      OH: (x0,x1) => { x0.scrollTop = x1 },
      OI: () => new XMLHttpRequest(),
      OJ: (x0,x1,x2) => x0.insertBefore(x1,x2),
      OK: x0 => x0.buildConfig,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: x0 => x0.maxTouchPoints,
      PE: x0 => x0.language,
      PF: x0 => x0.flags,
      PG: x0 => x0.buffer,
      PH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      PI: (x0,x1,x2) => x0.open(x1,x2),
      PJ: x0 => x0.id,
      PK: x0 => x0.length,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: x0 => x0.platform,
      QE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      QF: (a, s) => a.join(s),
      QG: x0 => x0.wasmMemory,
      QH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      QI: (x0,x1) => x0.send(x1),
      QJ: x0 => x0.offsetHeight,
      QK: x0 => x0.getReader(),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      RE: () => globalThis.window.FinalizationRegistry,
      RF: (x0,x1) => x0.error(x1),
      RG: () => globalThis.window._flutter_skwasmInstance,
      RH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      RI: x0 => x0.send(),
      RJ: x0 => x0.offsetWidth,
      RK: x0 => x0.value,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: Date.now,
      SE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      SF: () => globalThis.console,
      SG: () => new TextDecoder(),
      SH: x0 => x0.keyCode,
      SI: x0 => x0.abort(),
      SJ: x0 => x0.stopPropagation(),
      SK: x0 => x0.done,
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: (x0,x1) => x0.contains(x1),
      TE: x0 => new window.FinalizationRegistry(x0),
      TF: s => s.trimRight(),
      TG: (map, o, v) => map.set(o, v),
      TH: (x0,x1) => x0.scrollIntoView(x1),
      TI: x0 => x0.upload,
      TJ: x0 => x0.disabled,
      TK: x0 => x0.read(),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (x0,x1) => x0.exec(x1),
      UD: (decoder, codeUnits) => decoder.decode(codeUnits),
      UE: (x0,x1) => x0.unregister(x1),
      UF: x0 => x0.blur(),
      UG: (map, o) => map.get(o),
      UH: x0 => x0.multiViewEnabled,
      UI: x0 => x0.readyState,
      UJ: (x0,x1) => { x0.min = x1 },
      UK: x0 => x0.body,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: x0 => x0.length,
      VD: () => new TextDecoder("utf-8", {fatal: true}),
      VE: x0 => x0.preventDefault(),
      VF: x0 => x0.button,
      VG: () => new WeakMap(),
      VH: (x0,x1) => x0.replaceWith(x1),
      VI: x0 => x0.responseURL,
      VJ: (x0,x1) => { x0.max = x1 },
      VK: (x0,x1) => new OffscreenCanvas(x0,x1),
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (x0,x1) => { x0.lastIndex = x1 },
      WD: () => new TextDecoder("utf-8", {fatal: false}),
      WE: x0 => x0.parent,
      WF: (x0,x1) => x0.prepend(x1),
      WG: (x0,x1) => x0.getRandomValues(x1),
      WH: (x0,x1) => { x0.className = x1 },
      WI: x0 => x0.statusText,
      WJ: (x0,x1) => { x0.disabled = x1 },
      WK: x0 => x0.assetBase,
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      XD: (a, i, v) => a[i] = v,
      XE: x0 => x0.timeStamp,
      XF: x0 => x0.parentElement,
      XG: () => globalThis.crypto,
      XH: (x0,x1) => { x0.tabIndex = x1 },
      XI: x0 => x0.getAllResponseHeaders(),
      XJ: (x0,x1) => { x0.scrollLeft = x1 },
      XK: x0 => x0.loader,
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      YE: (x0,x1) => x0.hasAttribute(x1),
      YF: x0 => x0.innerHeight,
      YG: l => new DataView(new ArrayBuffer(l)),
      YH: (x0,x1) => { x0.action = x1 },
      YI: x0 => x0.status,
      YJ: (x0,x1) => { x0.spellcheck = x1 },
      YK: () => globalThis._flutter,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      ZE: x0 => x0.type,
      ZF: x0 => x0.innerWidth,
      ZG: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      ZH: (x0,x1) => { x0.method = x1 },
      ZI: x0 => x0.response,
      ZJ: (x0,x1) => { x0.disabled = x1 },
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      aE: (x0,x1) => x0.getModifierState(x1),
      aF: x0 => x0.height,
      aG: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      aH: (x0,x1) => { x0.noValidate = x1 },
      aI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aJ: (x0,x1) => x0.getItem(x1),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: x0 => x0.unicode,
      bD: (s) => +s,
      bE: x0 => x0.buttons,
      bF: x0 => x0.width,
      bG: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      bH: x0 => x0.click(),
      bI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      bJ: (x0,x1) => x0.key(x1),
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      cE: x0 => x0.ctrlKey,
      cF: x0 => x0.clientHeight,
      cG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      cH: (x0,x1) => x0.getElementsByClassName(x1),
      cI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      cJ: x0 => x0.length,
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.multiline,
      dD: s => s.trim(),
      dE: x0 => x0.getBoundingClientRect(),
      dF: x0 => x0.clientWidth,
      dG: x0 => x0.history,
      dH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      dI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      dJ: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => x0.drawImage(x1,x2,x3,x4,x5,x6,x7,x8,x9),
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: x0 => x0.classList,
      eE: x0 => x0.y,
      eF: x0 => x0.isConnected,
      eG: x0 => x0.search,
      eH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      eI: x0 => x0.withCredentials,
      eJ: (x0,x1) => x0.getContext(x1),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: o => o instanceof Array,
      fD: x0 => x0.relatedTarget,
      fE: x0 => x0.x,
      fF: x0 => x0.head,
      fG: x0 => x0.location,
      fH: (x0,x1) => x0.dispatchEvent(x1),
      fI: (x0,x1) => { x0.timeout = x1 },
      fJ: (x0,x1) => { x0.height = x1 },
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.top,
      gF: (x0,x1) => { x0.content = x1 },
      gG: x0 => x0.pathname,
      gH: (x0,x1) => x0.createEvent(x1),
      gI: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      gJ: (x0,x1) => { x0.width = x1 },
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.shiftKey,
      hE: x0 => x0.left,
      hF: (x0,x1) => { x0.name = x1 },
      hG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      hH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      hI: (x0,x1) => { x0.withCredentials = x1 },
      hJ: (x0,x1) => x0.transferFromImageBitmap(x1),
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.body,
      iE: x0 => x0.scrollTop,
      iF: (x0,x1) => x0.removeChild(x1),
      iG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      iH: x0 => x0.readText(),
      iI: (x0,x1) => { x0.responseType = x1 },
      iJ: x0 => x0.rasterEndMilliseconds,
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: x0 => x0.visibilityState,
      jE: x0 => x0.offsetTop,
      jF: x0 => x0.firstChild,
      jG: o => Object.keys(o),
      jH: x0 => x0.clipboard,
      jI: (x0,x1,x2) => x0.setItem(x1,x2),
      jJ: x0 => x0.rasterStartMilliseconds,
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      kE: x0 => x0.scrollLeft,
      kF: x0 => x0.viewConstraints,
      kG: x0 => x0.state,
      kH: (x0,x1) => x0.writeText(x1),
      kI: x0 => x0.localStorage,
      kJ: x0 => x0.imageBitmaps,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: Function.prototype.call.bind(String.prototype.toLowerCase),
      lD: (a, l) => a.length = l,
      lE: x0 => x0.offsetLeft,
      lF: x0 => x0.hostElement,
      lG: x0 => x0.hash,
      lH: x0 => x0.unlock(),
      lI: () => globalThis.window,
      lJ: x0 => x0.canvasKitMaximumSurfaces,
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: Object.is,
      mD: x0 => x0.disconnect(),
      mE: x0 => x0.offsetParent,
      mF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      mG: x0 => x0.state,
      mH: (x0,x1) => x0.lock(x1),
      mI: (a, l) => a.length = l,
      mJ: x0 => x0.hostElement,
      n: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.vendor,
      nD: x0 => new Intl.Locale(x0),
      nE: x0 => x0.offsetY,
      nF: x0 => ({runApp: x0}),
      nG: (x0,x1) => x0.go(x1),
      nH: x0 => x0.orientation,
      nI: x0 => x0.close(),
      nJ: x0 => x0.location,
      o: b => !!b,
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: (x0,x1) => x0.createTextNode(x1),
      oD: x0 => x0.region,
      oE: x0 => x0.offsetX,
      oF: () => typeof dartUseDateNowForTicks !== "undefined",
      oG: (x0,x1) => x0.querySelectorAll(x1),
      oH: (x0,x1) => x0.querySelector(x1),
      oI: x0 => x0.height,
      oJ: (x0,x1) => x0.getModifierState(x1),
      p: () => globalThis.document,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: (x0,x1) => { x0.id = x1 },
      pD: x0 => x0.script,
      pE: (o, p, r) => o.replace(p, () => r),
      pF: () => Date.now(),
      pG: (d, digits) => d.toFixed(digits),
      pH: (x0,x1) => { x0.title = x1 },
      pI: x0 => x0.width,
      pJ: x0 => x0.metaKey,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: (x0,x1) => { x0.nonce = x1 },
      qD: x0 => x0.language,
      qE: (o, p, r) => o.replaceAll(p, () => r),
      qF: () => 1000 * performance.now(),
      qG: x0 => x0.maxHeight,
      qH: (x0,x1) => x0.vibrate(x1),
      qI: (x0,x1,x2,x3,x4,x5) => x0.createImageBitmap(x1,x2,x3,x4,x5),
      qJ: x0 => x0.altKey,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: x0 => x0.languages,
      rE: x0 => x0.deltaMode,
      rF: (x0,x1) => x0.requestAnimationFrame(x1),
      rG: x0 => x0.maxWidth,
      rH: x0 => x0.arrayBuffer(),
      rI: (x0,x1) => x0.createImageBitmap(x1),
      rJ: x0 => x0.ctrlKey,
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: (x0,x1) => x0.observe(x1),
      sE: x0 => x0.deltaY,
      sF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      sG: x0 => x0.minHeight,
      sH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      sI: x0 => new Blob(x0),
      sJ: x0 => x0.isComposing,
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: (x0,x1) => x0.attachShadow(x1),
      tD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      tE: x0 => x0.deltaX,
      tF: x0 => x0.now(),
      tG: x0 => x0.minWidth,
      tH: x0 => x0.status,
      tI: x0 => x0.close(),
      tJ: x0 => x0.code,
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => new ResizeObserver(x0),
      uE: x0 => x0.wheelDeltaY,
      uF: x0 => x0.performance,
      uG: (x0,x1) => x0.removeProperty(x1),
      uH: (x0,x1) => x0.fetch(x1),
      uI: x0 => x0.naturalHeight,
      uJ: x0 => x0.repeat,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: (x0,x1) => x0.getPropertyValue(x1),
      vE: x0 => x0.wheelDeltaX,
      vF: x0 => new Uint8Array(x0),
      vG: (x0,x1) => x0.add(x1),
      vH: x0 => x0.content,
      vI: x0 => x0.naturalWidth,
      vJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => globalThis.parseFloat(x0),
      wE: x0 => x0.bottom,
      wF: (x0,x1,x2) => x0.slice(x1,x2),
      wG: x0 => x0.data,
      wH: x0 => x0.document,
      wI: (x0,x1) => { x0.src = x1 },
      wJ: x0 => x0.userAgent,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.devicePixelRatio,
      xD: (x0,x1) => x0.getComputedStyle(x1),
      xE: x0 => x0.right,
      xF: (x0,x1) => x0.decode(x1),
      xG: (x0,x1) => x0.removeAttribute(x1),
      xH: (a, i) => a.splice(i, 1),
      xI: x0 => x0.displayHeight,
      xJ: x0 => x0.navigator,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: x0 => x0.documentElement,
      yE: x0 => x0.clientY,
      yF: (x0,x1) => x0.adoptText(x1),
      yG: (x0,x1) => { x0.value = x1 },
      yH: a => a.pop(),
      yI: x0 => x0.displayWidth,
      yJ: x0 => x0.maxTouchPoints,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: x0 => x0.computedStyleMap(),
      zE: x0 => x0.clientX,
      zF: x0 => x0.first(),
      zG: (x0,x1) => { x0.value = x1 },
      zH: x0 => x0.debugSkipFontRetryDelay,
      zI: x0 => x0.duration,
      zJ: x0 => x0.hardwareConcurrency,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
