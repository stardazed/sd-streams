(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.sdZlib = {}));
}(this, (function (exports) { 'use strict';

	/*
	@stardazed/zlib - Zlib library implementation
	Part of Stardazed
	(c) 2018-Present by Arthur Langereis - @zenmumbler
	https://github.com/stardazed/sd-zlib

	Based on zip.js (c) 2013 by Gildas Lormeau
	Based on zlib (c) 1995-Present Jean-loup Gailly and Mark Adler
	*/

	const PRESET_DICT = 0x20;
	const Z_DEFLATED = 8;
	const GZIP_ID1 = 0x1F;
	const GZIP_ID2 = 0x8B;
	const inflate_mask = [
	    0x00000000, 0x00000001, 0x00000003, 0x00000007,
	    0x0000000f, 0x0000001f, 0x0000003f, 0x0000007f,
	    0x000000ff, 0x000001ff, 0x000003ff, 0x000007ff,
	    0x00000fff, 0x00001fff, 0x00003fff, 0x00007fff,
	    0x0000ffff
	];
	const swap32 = (q) => (((q >>> 24) & 0xff) | ((q >>> 8) & 0xff00) |
	    ((q & 0xff00) << 8) | ((q & 0xff) << 24)) >>> 0;
	function u8ArrayFromBufferSource(source) {
	    if (source instanceof ArrayBuffer) {
	        return new Uint8Array(source);
	    }
	    if (!ArrayBuffer.isView(source)) {
	        return undefined;
	    }
	    if (!(source instanceof Uint8Array)) {
	        return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	    }
	    return source;
	}
	function mergeBuffers(buffers) {
	    const totalSize = buffers.map(b => b.byteLength).reduce((s, l) => s + l, 0);
	    const output = new Uint8Array(totalSize);
	    let offset = 0;
	    for (const buf of buffers) {
	        output.set(buf, offset);
	        offset += buf.length;
	    }
	    return output;
	}

	function adler32(source, seed = 1) {
	    const view = u8ArrayFromBufferSource(source);
	    if (!view) {
	        throw new TypeError("source must be a BufferSource");
	    }
	    return computeAdler32(view, seed);
	}
	const BASE = 65521;
	const NMAX = 5552;
	function computeAdler32(buf, adler = 1) {
	    let sum2 = (adler >>> 16) & 0xffff;
	    adler &= 0xffff;
	    let len = buf.length;
	    let offset = 0;
	    while (len >= NMAX) {
	        len -= NMAX;
	        let n = NMAX / 16;
	        do {
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	        } while (--n);
	        adler %= BASE;
	        sum2 += BASE;
	    }
	    if (len) {
	        while (len >= 16) {
	            len -= 16;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	            adler += buf[offset++];
	            sum2 += adler;
	        }
	        while (len--) {
	            adler += buf[offset++];
	            sum2 += adler;
	        }
	        adler %= BASE;
	        sum2 %= BASE;
	    }
	    return adler | (sum2 << 16);
	}

	function crc32(source, seed = 0) {
	    const view = u8ArrayFromBufferSource(source);
	    if (!view) {
	        throw new TypeError("source must be a BufferSource");
	    }
	    return computeCRC32(view, seed);
	}
	const endian = new Uint32Array([1]);
	const endianCheck = new Uint8Array(endian.buffer, 0, 1)[0];
	const computeCRC32 = (endianCheck === 1) ? computeCRC32Little : computeCRC32Big;
	function computeCRC32Little(buf, crc = 0) {
	    let c = ~crc;
	    let offset = buf.byteOffset;
	    let position = 0;
	    let len = buf.byteLength;
	    const table0 = crcTables[0];
	    const table1 = crcTables[1];
	    const table2 = crcTables[2];
	    const table3 = crcTables[3];
	    while (len && (offset & 3)) {
	        c = table0[(c ^ buf[position++]) & 0xff] ^ (c >>> 8);
	        len--;
	        offset++;
	    }
	    const buf4 = new Uint32Array(buf.buffer, offset, len >>> 2);
	    let pos4 = 0;
	    while (len >= 32) {
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        len -= 32;
	    }
	    while (len >= 4) {
	        c ^= buf4[pos4++];
	        c = table3[c & 0xff] ^ table2[(c >>> 8) & 0xff] ^ table1[(c >>> 16) & 0xff] ^ table0[c >>> 24];
	        len -= 4;
	    }
	    if (len) {
	        position += pos4 * 4;
	        do {
	            c = table0[(c ^ buf[position++]) & 0xff] ^ (c >>> 8);
	        } while (--len);
	    }
	    c = ~c;
	    return c;
	}
	function computeCRC32Big(buf, crc = 0) {
	    let c = ~swap32(crc);
	    let offset = buf.byteOffset;
	    let position = 0;
	    let len = buf.byteLength;
	    const table4 = crcTables[4];
	    const table5 = crcTables[5];
	    const table6 = crcTables[6];
	    const table7 = crcTables[7];
	    while (len && (offset & 3)) {
	        c = table4[(c >>> 24) ^ buf[position++]] ^ (c << 8);
	        len--;
	        offset++;
	    }
	    const buf4 = new Uint32Array(buf.buffer, offset, len >>> 2);
	    let pos4 = 0;
	    while (len >= 32) {
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        len -= 32;
	    }
	    while (len >= 4) {
	        c ^= buf4[pos4++];
	        c = table4[c & 0xff] ^ table5[(c >>> 8) & 0xff] ^ table6[(c >>> 16) & 0xff] ^ table7[c >>> 24];
	        len -= 4;
	    }
	    if (len) {
	        position += pos4 * 4;
	        do {
	            c = table4[(c >>> 24) ^ buf[position++]] ^ (c << 8);
	        } while (--len);
	    }
	    c = ~c;
	    return swap32(c);
	}
	function makeCRCTables() {
	    const tables = new Array(8).fill(256).map(c => new Uint32Array(c));
	    for (let n = 0; n < 256; n++) {
	        let c = n;
	        for (let k = 0; k < 8; k++) {
	            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	        }
	        tables[0][n] = c;
	        tables[4][n] = swap32(c);
	    }
	    for (let n = 0; n < 256; n++) {
	        let c = tables[0][n];
	        for (let k = 1; k < 4; k++) {
	            c = tables[0][c & 0xff] ^ (c >>> 8);
	            tables[k][n] = c;
	            tables[k + 4][n] = swap32(c);
	        }
	    }
	    return tables;
	}
	const crcTables = makeCRCTables();

	const OUTPUT_BUFSIZE = 16384;
	class ZStream {
	    constructor() {
	        this.avail_in = 0;
	        this.next_in_index = 0;
	        this.next_out = new Uint8Array(OUTPUT_BUFSIZE);
	        this.avail_out = this.next_out.byteLength;
	        this.next_out_index = 0;
	        this.total_in = this.total_out = 0;
	        this.msg = "";
	    }
	    append(data) {
	        this.next_in = data;
	        this.avail_in = data.length;
	        this.next_in_index = 0;
	    }
	    read_buf(start, size) {
	        return this.next_in.subarray(start, start + size);
	    }
	    read_into_buf(buf, start, size) {
	        let len = this.avail_in;
	        if (len > size)
	            len = size;
	        if (len === 0)
	            return 0;
	        buf.set(this.next_in.subarray(this.next_in_index, this.next_in_index + len), start);
	        this.avail_in -= len;
	        this.next_in_index += len;
	        this.total_in += len;
	        return len;
	    }
	    flush_pending(dstate) {
	        var len = dstate.pending;
	        if (len > this.avail_out)
	            len = this.avail_out;
	        if (len === 0)
	            return;
	        this.next_out.set(dstate.pending_buf.subarray(dstate.pending_out, dstate.pending_out + len), this.next_out_index);
	        this.next_out_index += len;
	        dstate.pending_out += len;
	        this.total_out += len;
	        this.avail_out -= len;
	        dstate.pending -= len;
	        if (dstate.pending === 0) {
	            dstate.pending_out = 0;
	        }
	    }
	}

	function InfCodes() {
	    let mode;
	    let len = 0;
	    let tree;
	    let tree_index = 0;
	    let need = 0;
	    let lit = 0;
	    let get = 0;
	    let dist = 0;
	    let lbits = 0;
	    let dbits = 0;
	    let ltree;
	    let ltree_index = 0;
	    let dtree;
	    let dtree_index = 0;
	    function inflate_fast(bl, bd, tl, tl_index, td, td_index, s, z) {
	        let t;
	        let tp;
	        let tp_index;
	        let e;
	        let b;
	        let k;
	        let p;
	        let n;
	        let q;
	        let m;
	        let ml;
	        let md;
	        let c;
	        let d;
	        let r;
	        let tp_index_t_3;
	        p = z.next_in_index;
	        n = z.avail_in;
	        b = s.bitb;
	        k = s.bitk;
	        q = s.write;
	        m = q < s.read ? s.read - q - 1 : s.end - q;
	        ml = inflate_mask[bl];
	        md = inflate_mask[bd];
	        do {
	            while (k < (20)) {
	                n--;
	                b |= (z.next_in[p++] & 0xff) << k;
	                k += 8;
	            }
	            t = b & ml;
	            tp = tl;
	            tp_index = tl_index;
	            tp_index_t_3 = (tp_index + t) * 3;
	            e = tp[tp_index_t_3];
	            if (e === 0) {
	                b >>= (tp[tp_index_t_3 + 1]);
	                k -= (tp[tp_index_t_3 + 1]);
	                s.window[q++] = tp[tp_index_t_3 + 2];
	                m--;
	                continue;
	            }
	            do {
	                b >>= (tp[tp_index_t_3 + 1]);
	                k -= (tp[tp_index_t_3 + 1]);
	                if ((e & 16) !== 0) {
	                    e &= 15;
	                    c = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]);
	                    b >>= e;
	                    k -= e;
	                    while (k < (15)) {
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    t = b & md;
	                    tp = td;
	                    tp_index = td_index;
	                    tp_index_t_3 = (tp_index + t) * 3;
	                    e = tp[tp_index_t_3];
	                    do {
	                        b >>= (tp[tp_index_t_3 + 1]);
	                        k -= (tp[tp_index_t_3 + 1]);
	                        if ((e & 16) !== 0) {
	                            e &= 15;
	                            while (k < (e)) {
	                                n--;
	                                b |= (z.next_in[p++] & 0xff) << k;
	                                k += 8;
	                            }
	                            d = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]);
	                            b >>= (e);
	                            k -= (e);
	                            m -= c;
	                            if (q >= d) {
	                                r = q - d;
	                                s.window[q++] = s.window[r++];
	                                s.window[q++] = s.window[r++];
	                                c -= 2;
	                            }
	                            else {
	                                r = q - d;
	                                do {
	                                    r += s.end;
	                                } while (r < 0);
	                                e = s.end - r;
	                                if (c > e) {
	                                    c -= e;
	                                    do {
	                                        s.window[q++] = s.window[r++];
	                                    } while (--e !== 0);
	                                    r = 0;
	                                }
	                            }
	                            do {
	                                s.window[q++] = s.window[r++];
	                            } while (--c !== 0);
	                            break;
	                        }
	                        else if ((e & 64) === 0) {
	                            t += tp[tp_index_t_3 + 2];
	                            t += (b & inflate_mask[e]);
	                            tp_index_t_3 = (tp_index + t) * 3;
	                            e = tp[tp_index_t_3];
	                        }
	                        else {
	                            z.msg = "invalid distance code";
	                            c = z.avail_in - n;
	                            c = (k >> 3) < c ? k >> 3 : c;
	                            n += c;
	                            p -= c;
	                            k -= c << 3;
	                            s.bitb = b;
	                            s.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            s.write = q;
	                            return -3;
	                        }
	                    } while (true);
	                    break;
	                }
	                if ((e & 64) === 0) {
	                    t += tp[tp_index_t_3 + 2];
	                    t += (b & inflate_mask[e]);
	                    tp_index_t_3 = (tp_index + t) * 3;
	                    e = tp[tp_index_t_3];
	                    if (e === 0) {
	                        b >>= (tp[tp_index_t_3 + 1]);
	                        k -= (tp[tp_index_t_3 + 1]);
	                        s.window[q++] = tp[tp_index_t_3 + 2];
	                        m--;
	                        break;
	                    }
	                }
	                else if ((e & 32) !== 0) {
	                    c = z.avail_in - n;
	                    c = (k >> 3) < c ? k >> 3 : c;
	                    n += c;
	                    p -= c;
	                    k -= c << 3;
	                    s.bitb = b;
	                    s.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    s.write = q;
	                    return 1;
	                }
	                else {
	                    z.msg = "invalid literal/length code";
	                    c = z.avail_in - n;
	                    c = (k >> 3) < c ? k >> 3 : c;
	                    n += c;
	                    p -= c;
	                    k -= c << 3;
	                    s.bitb = b;
	                    s.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    s.write = q;
	                    return -3;
	                }
	            } while (true);
	        } while (m >= 258 && n >= 10);
	        c = z.avail_in - n;
	        c = (k >> 3) < c ? k >> 3 : c;
	        n += c;
	        p -= c;
	        k -= c << 3;
	        s.bitb = b;
	        s.bitk = k;
	        z.avail_in = n;
	        z.total_in += p - z.next_in_index;
	        z.next_in_index = p;
	        s.write = q;
	        return 0;
	    }
	    function init(bl, bd, tl, tl_index, td, td_index) {
	        mode = 0;
	        lbits = bl;
	        dbits = bd;
	        ltree = tl;
	        ltree_index = tl_index;
	        dtree = td;
	        dtree_index = td_index;
	    }
	    function proc(s, z, r) {
	        let j;
	        let tindex;
	        let e;
	        let b = 0;
	        let k = 0;
	        let p = 0;
	        let n;
	        let q;
	        let m;
	        let f;
	        p = z.next_in_index;
	        n = z.avail_in;
	        b = s.bitb;
	        k = s.bitk;
	        q = s.write;
	        m = q < s.read ? s.read - q - 1 : s.end - q;
	        while (true) {
	            switch (mode) {
	                case 0:
	                    if (m >= 258 && n >= 10) {
	                        s.bitb = b;
	                        s.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        s.write = q;
	                        r = inflate_fast(lbits, dbits, ltree, ltree_index, dtree, dtree_index, s, z);
	                        p = z.next_in_index;
	                        n = z.avail_in;
	                        b = s.bitb;
	                        k = s.bitk;
	                        q = s.write;
	                        m = q < s.read ? s.read - q - 1 : s.end - q;
	                        if (r !== 0) {
	                            mode = r === 1 ? 7 : 9;
	                            break;
	                        }
	                    }
	                    need = lbits;
	                    tree = ltree;
	                    tree_index = ltree_index;
	                    mode = 1;
	                case 1:
	                    j = need;
	                    while (k < (j)) {
	                        if (n !== 0) {
	                            r = 0;
	                        }
	                        else {
	                            s.bitb = b;
	                            s.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            s.write = q;
	                            return s.inflate_flush(z, r);
	                        }
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    tindex = (tree_index + (b & inflate_mask[j])) * 3;
	                    b >>>= (tree[tindex + 1]);
	                    k -= (tree[tindex + 1]);
	                    e = tree[tindex];
	                    if (e === 0) {
	                        lit = tree[tindex + 2];
	                        mode = 6;
	                        break;
	                    }
	                    if ((e & 16) !== 0) {
	                        get = e & 15;
	                        len = tree[tindex + 2];
	                        mode = 2;
	                        break;
	                    }
	                    if ((e & 64) === 0) {
	                        need = e;
	                        tree_index = tindex / 3 + tree[tindex + 2];
	                        break;
	                    }
	                    if ((e & 32) !== 0) {
	                        mode = 7;
	                        break;
	                    }
	                    mode = 9;
	                    z.msg = "invalid literal/length code";
	                    r = -3;
	                    s.bitb = b;
	                    s.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    s.write = q;
	                    return s.inflate_flush(z, r);
	                case 2:
	                    j = get;
	                    while (k < (j)) {
	                        if (n !== 0) {
	                            r = 0;
	                        }
	                        else {
	                            s.bitb = b;
	                            s.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            s.write = q;
	                            return s.inflate_flush(z, r);
	                        }
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    len += (b & inflate_mask[j]);
	                    b >>= j;
	                    k -= j;
	                    need = dbits;
	                    tree = dtree;
	                    tree_index = dtree_index;
	                    mode = 3;
	                case 3:
	                    j = need;
	                    while (k < (j)) {
	                        if (n !== 0) {
	                            r = 0;
	                        }
	                        else {
	                            s.bitb = b;
	                            s.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            s.write = q;
	                            return s.inflate_flush(z, r);
	                        }
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    tindex = (tree_index + (b & inflate_mask[j])) * 3;
	                    b >>= tree[tindex + 1];
	                    k -= tree[tindex + 1];
	                    e = (tree[tindex]);
	                    if ((e & 16) !== 0) {
	                        get = e & 15;
	                        dist = tree[tindex + 2];
	                        mode = 4;
	                        break;
	                    }
	                    if ((e & 64) === 0) {
	                        need = e;
	                        tree_index = tindex / 3 + tree[tindex + 2];
	                        break;
	                    }
	                    mode = 9;
	                    z.msg = "invalid distance code";
	                    r = -3;
	                    s.bitb = b;
	                    s.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    s.write = q;
	                    return s.inflate_flush(z, r);
	                case 4:
	                    j = get;
	                    while (k < (j)) {
	                        if (n !== 0) {
	                            r = 0;
	                        }
	                        else {
	                            s.bitb = b;
	                            s.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            s.write = q;
	                            return s.inflate_flush(z, r);
	                        }
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    dist += (b & inflate_mask[j]);
	                    b >>= j;
	                    k -= j;
	                    mode = 5;
	                case 5:
	                    f = q - dist;
	                    while (f < 0) {
	                        f += s.end;
	                    }
	                    while (len !== 0) {
	                        if (m === 0) {
	                            if (q === s.end && s.read !== 0) {
	                                q = 0;
	                                m = q < s.read ? s.read - q - 1 : s.end - q;
	                            }
	                            if (m === 0) {
	                                s.write = q;
	                                r = s.inflate_flush(z, r);
	                                q = s.write;
	                                m = q < s.read ? s.read - q - 1 : s.end - q;
	                                if (q === s.end && s.read !== 0) {
	                                    q = 0;
	                                    m = q < s.read ? s.read - q - 1 : s.end - q;
	                                }
	                                if (m === 0) {
	                                    s.bitb = b;
	                                    s.bitk = k;
	                                    z.avail_in = n;
	                                    z.total_in += p - z.next_in_index;
	                                    z.next_in_index = p;
	                                    s.write = q;
	                                    return s.inflate_flush(z, r);
	                                }
	                            }
	                        }
	                        s.window[q++] = s.window[f++];
	                        m--;
	                        if (f === s.end) {
	                            f = 0;
	                        }
	                        len--;
	                    }
	                    mode = 0;
	                    break;
	                case 6:
	                    if (m === 0) {
	                        if (q === s.end && s.read !== 0) {
	                            q = 0;
	                            m = q < s.read ? s.read - q - 1 : s.end - q;
	                        }
	                        if (m === 0) {
	                            s.write = q;
	                            r = s.inflate_flush(z, r);
	                            q = s.write;
	                            m = q < s.read ? s.read - q - 1 : s.end - q;
	                            if (q === s.end && s.read !== 0) {
	                                q = 0;
	                                m = q < s.read ? s.read - q - 1 : s.end - q;
	                            }
	                            if (m === 0) {
	                                s.bitb = b;
	                                s.bitk = k;
	                                z.avail_in = n;
	                                z.total_in += p - z.next_in_index;
	                                z.next_in_index = p;
	                                s.write = q;
	                                return s.inflate_flush(z, r);
	                            }
	                        }
	                    }
	                    r = 0;
	                    s.window[q++] = lit;
	                    m--;
	                    mode = 0;
	                    break;
	                case 7:
	                    if (k > 7) {
	                        k -= 8;
	                        n++;
	                        p--;
	                    }
	                    s.write = q;
	                    r = s.inflate_flush(z, r);
	                    q = s.write;
	                    m = q < s.read ? s.read - q - 1 : s.end - q;
	                    if (s.read !== s.write) {
	                        s.bitb = b;
	                        s.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        s.write = q;
	                        return s.inflate_flush(z, r);
	                    }
	                    mode = 8;
	                case 8:
	                    r = 1;
	                    s.bitb = b;
	                    s.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    s.write = q;
	                    return s.inflate_flush(z, r);
	                case 9:
	                    r = -3;
	                    s.bitb = b;
	                    s.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    s.write = q;
	                    return s.inflate_flush(z, r);
	                default:
	                    r = -2;
	                    s.bitb = b;
	                    s.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    s.write = q;
	                    return s.inflate_flush(z, r);
	            }
	        }
	    }
	    return {
	        init, proc
	    };
	}

	const fixed_bl = 9;
	const fixed_bd = 5;
	const fixed_tl = [
	    96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9, 192, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 160, 0, 8, 0,
	    0, 8, 128, 0, 8, 64, 0, 9, 224, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 144, 83, 7, 59, 0, 8, 120, 0, 8, 56, 0, 9, 208, 81, 7, 17, 0, 8, 104, 0, 8, 40,
	    0, 9, 176, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 240, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8, 227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 200, 81, 7, 13,
	    0, 8, 100, 0, 8, 36, 0, 9, 168, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 232, 80, 7, 8, 0, 8, 92, 0, 8, 28, 0, 9, 152, 84, 7, 83, 0, 8, 124, 0, 8, 60,
	    0, 9, 216, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 184, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9, 248, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7,
	    35, 0, 8, 114, 0, 8, 50, 0, 9, 196, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 164, 0, 8, 2, 0, 8, 130, 0, 8, 66, 0, 9, 228, 80, 7, 7, 0, 8, 90, 0, 8,
	    26, 0, 9, 148, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 212, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9, 180, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 244, 80,
	    7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 204, 81, 7, 15, 0, 8, 102, 0, 8, 38, 0, 9, 172, 0, 8, 6, 0, 8, 134, 0,
	    8, 70, 0, 9, 236, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 156, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9, 220, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 188, 0,
	    8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 252, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0, 8, 113, 0, 8, 49, 0, 9, 194, 80, 7, 10, 0, 8, 97,
	    0, 8, 33, 0, 9, 162, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 226, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9, 146, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 210,
	    81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 178, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 242, 80, 7, 4, 0, 8, 85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117,
	    0, 8, 53, 0, 9, 202, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 170, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9, 234, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 154,
	    84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 218, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 186, 0, 8, 13, 0, 8, 141, 0, 8, 77, 0, 9, 250, 80, 7, 3, 0, 8, 83,
	    0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 198, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9, 166, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 230,
	    80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 150, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 214, 82, 7, 19, 0, 8, 107, 0, 8, 43, 0, 9, 182, 0, 8, 11, 0, 8, 139,
	    0, 8, 75, 0, 9, 246, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9, 206, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 174,
	    0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 238, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 158, 84, 7, 99, 0, 8, 127, 0, 8, 63, 0, 9, 222, 82, 7, 27, 0, 8, 111,
	    0, 8, 47, 0, 9, 190, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 254, 96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9,
	    193, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 161, 0, 8, 0, 0, 8, 128, 0, 8, 64, 0, 9, 225, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 145, 83, 7, 59, 0, 8,
	    120, 0, 8, 56, 0, 9, 209, 81, 7, 17, 0, 8, 104, 0, 8, 40, 0, 9, 177, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 241, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8,
	    227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 201, 81, 7, 13, 0, 8, 100, 0, 8, 36, 0, 9, 169, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 233, 80, 7, 8, 0, 8,
	    92, 0, 8, 28, 0, 9, 153, 84, 7, 83, 0, 8, 124, 0, 8, 60, 0, 9, 217, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 185, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9,
	    249, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7, 35, 0, 8, 114, 0, 8, 50, 0, 9, 197, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 165, 0, 8, 2, 0, 8,
	    130, 0, 8, 66, 0, 9, 229, 80, 7, 7, 0, 8, 90, 0, 8, 26, 0, 9, 149, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 213, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9,
	    181, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 245, 80, 7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 205, 81, 7, 15, 0, 8,
	    102, 0, 8, 38, 0, 9, 173, 0, 8, 6, 0, 8, 134, 0, 8, 70, 0, 9, 237, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 157, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9,
	    221, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 189, 0, 8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 253, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0,
	    8, 113, 0, 8, 49, 0, 9, 195, 80, 7, 10, 0, 8, 97, 0, 8, 33, 0, 9, 163, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 227, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9,
	    147, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 211, 81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 179, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 243, 80, 7, 4, 0, 8,
	    85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117, 0, 8, 53, 0, 9, 203, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 171, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9,
	    235, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 155, 84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 219, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 187, 0, 8, 13, 0, 8,
	    141, 0, 8, 77, 0, 9, 251, 80, 7, 3, 0, 8, 83, 0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 199, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9,
	    167, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 231, 80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 151, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 215, 82, 7, 19, 0, 8,
	    107, 0, 8, 43, 0, 9, 183, 0, 8, 11, 0, 8, 139, 0, 8, 75, 0, 9, 247, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9,
	    207, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 175, 0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 239, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 159, 84, 7, 99, 0, 8,
	    127, 0, 8, 63, 0, 9, 223, 82, 7, 27, 0, 8, 111, 0, 8, 47, 0, 9, 191, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 255
	];
	const fixed_td = [
	    80, 5, 1, 87, 5, 257, 83, 5, 17, 91, 5, 4097, 81, 5, 5, 89, 5, 1025, 85, 5, 65, 93, 5, 16385, 80, 5, 3, 88, 5, 513, 84, 5, 33, 92, 5,
	    8193, 82, 5, 9, 90, 5, 2049, 86, 5, 129, 192, 5, 24577, 80, 5, 2, 87, 5, 385, 83, 5, 25, 91, 5, 6145, 81, 5, 7, 89, 5, 1537, 85, 5, 97, 93, 5,
	    24577, 80, 5, 4, 88, 5, 769, 84, 5, 49, 92, 5, 12289, 82, 5, 13, 90, 5, 3073, 86, 5, 193, 192, 5, 24577
	];
	const cplens = [
	    3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
	];
	const cplext = [
	    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 112, 112
	];
	const cpdist = [
	    1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577
	];
	const cpdext = [
	    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13
	];
	const BMAX = 15;
	let v;
	const hn = [0];
	const c = new Int32Array(BMAX + 1);
	const r = new Int32Array(3);
	const u = new Int32Array(BMAX);
	const x = new Int32Array(BMAX + 1);
	function huft_build(b, bindex, n, s, d, e, t, m, hp, hn, v) {
	    let a;
	    let f;
	    let g;
	    let h;
	    let i;
	    let j;
	    let k;
	    let l;
	    let mask;
	    let p;
	    let q;
	    let w;
	    let xp;
	    let y;
	    let z;
	    p = 0;
	    i = n;
	    do {
	        c[b[bindex + p]]++;
	        p++;
	        i--;
	    } while (i !== 0);
	    if (c[0] === n) {
	        t[0] = -1;
	        m[0] = 0;
	        return 0;
	    }
	    l = m[0];
	    for (j = 1; j <= BMAX; j++) {
	        if (c[j] !== 0) {
	            break;
	        }
	    }
	    k = j;
	    if (l < j) {
	        l = j;
	    }
	    for (i = BMAX; i !== 0; i--) {
	        if (c[i] !== 0) {
	            break;
	        }
	    }
	    g = i;
	    if (l > i) {
	        l = i;
	    }
	    m[0] = l;
	    for (y = 1 << j; j < i; j++, y <<= 1) {
	        y -= c[j];
	        if (y < 0) {
	            return -3;
	        }
	    }
	    y -= c[i];
	    if (y < 0) {
	        return -3;
	    }
	    c[i] += y;
	    x[1] = j = 0;
	    p = 1;
	    xp = 2;
	    while (--i !== 0) {
	        x[xp] = (j += c[p]);
	        xp++;
	        p++;
	    }
	    i = 0;
	    p = 0;
	    do {
	        j = b[bindex + p];
	        if (j !== 0) {
	            v[x[j]++] = i;
	        }
	        p++;
	    } while (++i < n);
	    n = x[g];
	    x[0] = i = 0;
	    p = 0;
	    h = -1;
	    w = -l;
	    u[0] = 0;
	    q = 0;
	    z = 0;
	    for (; k <= g; k++) {
	        a = c[k];
	        while (a-- !== 0) {
	            while (k > w + l) {
	                h++;
	                w += l;
	                z = g - w;
	                z = (z > l) ? l : z;
	                f = 1 << (j = k - w);
	                if (f > a + 1) {
	                    f -= a + 1;
	                    xp = k;
	                    if (j < z) {
	                        while (++j < z) {
	                            f <<= 1;
	                            if (f <= c[++xp]) {
	                                break;
	                            }
	                            f -= c[xp];
	                        }
	                    }
	                }
	                z = 1 << j;
	                if (hn[0] + z > 1400) {
	                    return -3;
	                }
	                u[h] = q = hn[0];
	                hn[0] += z;
	                if (h !== 0) {
	                    x[h] = i;
	                    r[0] = j;
	                    r[1] = l;
	                    j = i >>> (w - l);
	                    r[2] = (q - u[h - 1] - j);
	                    hp.set(r, (u[h - 1] + j) * 3);
	                }
	                else {
	                    t[0] = q;
	                }
	            }
	            r[1] = (k - w);
	            if (p >= n) {
	                r[0] = 128 + 64;
	            }
	            else if (v[p] < s) {
	                r[0] = (v[p] < 256 ? 0 : 32 + 64);
	                r[2] = v[p++];
	            }
	            else {
	                r[0] = (e[v[p] - s] + 16 + 64);
	                r[2] = d[v[p++] - s];
	            }
	            f = 1 << (k - w);
	            for (j = i >>> w; j < z; j += f) {
	                hp.set(r, (q + j) * 3);
	            }
	            for (j = 1 << (k - 1); (i & j) !== 0; j >>>= 1) {
	                i ^= j;
	            }
	            i ^= j;
	            mask = (1 << w) - 1;
	            while ((i & mask) !== x[h]) {
	                h--;
	                w -= l;
	                mask = (1 << w) - 1;
	            }
	        }
	    }
	    return y !== 0 && g !== 1 ? -5 : 0;
	}
	function initWorkArea(vsize) {
	    v = new Int32Array(vsize);
	    for (let i = 0; i < BMAX + 1; i++) {
	        c[i] = 0;
	        u[i] = 0;
	        x[i] = 0;
	    }
	    for (let i = 0; i < 3; i++) {
	        r[i] = 0;
	    }
	}
	function inflate_trees_bits(c, bb, tb, hp, z) {
	    initWorkArea(19);
	    hn[0] = 0;
	    let result = huft_build(c, 0, 19, 19, null, null, tb, bb, hp, hn, v);
	    if (result === -3) {
	        z.msg = "oversubscribed dynamic bit lengths tree";
	    }
	    else if (result === -5 || bb[0] === 0) {
	        z.msg = "incomplete dynamic bit lengths tree";
	        result = -3;
	    }
	    return result;
	}
	function inflate_trees_dynamic(nl, nd, c, bl, bd, tl, td, hp, z) {
	    initWorkArea(288);
	    hn[0] = 0;
	    let result = huft_build(c, 0, nl, 257, cplens, cplext, tl, bl, hp, hn, v);
	    if (result !== 0 || bl[0] === 0) {
	        if (result === -3) {
	            z.msg = "oversubscribed literal/length tree";
	        }
	        else {
	            z.msg = "incomplete literal/length tree";
	            result = -3;
	        }
	        return result;
	    }
	    initWorkArea(288);
	    result = huft_build(c, nl, nd, 0, cpdist, cpdext, td, bd, hp, hn, v);
	    if (result !== 0 || (bd[0] === 0 && nl > 257)) {
	        if (result === -3) {
	            z.msg = "oversubscribed distance tree";
	        }
	        else if (result === -5) {
	            z.msg = "incomplete distance tree";
	            result = -3;
	        }
	        else {
	            z.msg = "empty distance tree with lengths";
	            result = -3;
	        }
	        return result;
	    }
	    return 0;
	}
	function inflate_trees_fixed(bl, bd, tl, td) {
	    bl[0] = fixed_bl;
	    bd[0] = fixed_bd;
	    tl[0] = fixed_tl;
	    td[0] = fixed_td;
	    return 0;
	}

	const border = [
	    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
	];
	class InfBlocks {
	    constructor(windowSize) {
	        this.codes = InfCodes();
	        this.hufts = new Int32Array(1400 * 3);
	        this.mode = 0;
	        this.bitk = 0;
	        this.bitb = 0;
	        this.read = 0;
	        this.write = 0;
	        this.last = 0;
	        this.end = windowSize;
	        this.window = new Uint8Array(windowSize);
	    }
	    reset() {
	        this.bitk = 0;
	        this.bitb = 0;
	        this.read = 0;
	        this.write = 0;
	        this.last = 0;
	    }
	    inflate_flush(z, r) {
	        let n;
	        let p;
	        let q;
	        p = z.next_out_index;
	        q = this.read;
	        n = ((q <= this.write ? this.write : this.end) - q);
	        if (n > z.avail_out) {
	            n = z.avail_out;
	        }
	        if (n !== 0 && r === -5) {
	            r = 0;
	        }
	        z.avail_out -= n;
	        z.total_out += n;
	        z.next_out.set(this.window.subarray(q, q + n), p);
	        p += n;
	        q += n;
	        if (q === this.end) {
	            q = 0;
	            if (this.write === this.end) {
	                this.write = 0;
	            }
	            n = this.write - q;
	            if (n > z.avail_out) {
	                n = z.avail_out;
	            }
	            if (n !== 0 && r === -5) {
	                r = 0;
	            }
	            z.avail_out -= n;
	            z.total_out += n;
	            z.next_out.set(this.window.subarray(q, q + n), p);
	            p += n;
	            q += n;
	        }
	        z.next_out_index = p;
	        this.read = q;
	        return r;
	    }
	    proc(z, r) {
	        let t;
	        let b;
	        let k;
	        let p;
	        let n;
	        let q;
	        let m;
	        let i;
	        let left = 0;
	        let table = 0;
	        let index = 0;
	        const blens = new Uint8Array(320);
	        const bb = [0];
	        const tb = [0];
	        const codes = this.codes;
	        const hufts = this.hufts;
	        p = z.next_in_index;
	        n = z.avail_in;
	        b = this.bitb;
	        k = this.bitk;
	        q = this.write;
	        m = (q < this.read ? this.read - q - 1 : this.end - q);
	        while (true) {
	            switch (this.mode) {
	                case 0:
	                    if (this.last) {
	                        return 1;
	                    }
	                    while (k < (3)) {
	                        if (n !== 0) {
	                            r = 0;
	                        }
	                        else {
	                            this.bitb = b;
	                            this.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            this.write = q;
	                            return this.inflate_flush(z, r);
	                        }
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    t = (b & 7);
	                    this.last = t & 1;
	                    switch (t >>> 1) {
	                        case 0:
	                            b >>>= (3);
	                            k -= (3);
	                            t = k & 7;
	                            b >>>= (t);
	                            k -= (t);
	                            this.mode = 1;
	                            break;
	                        case 1:
	                            const bl = [0];
	                            const bd = [0];
	                            const tl = [[]];
	                            const td = [[]];
	                            inflate_trees_fixed(bl, bd, tl, td);
	                            codes.init(bl[0], bd[0], tl[0], 0, td[0], 0);
	                            b >>>= (3);
	                            k -= (3);
	                            this.mode = 6;
	                            break;
	                        case 2:
	                            b >>>= (3);
	                            k -= (3);
	                            this.mode = 3;
	                            break;
	                        case 3:
	                            b >>>= (3);
	                            k -= (3);
	                            this.mode = 9;
	                            z.msg = "invalid block type";
	                            r = -3;
	                            this.bitb = b;
	                            this.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            this.write = q;
	                            return this.inflate_flush(z, r);
	                    }
	                    break;
	                case 1:
	                    while (k < (32)) {
	                        if (n !== 0) {
	                            r = 0;
	                        }
	                        else {
	                            this.bitb = b;
	                            this.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            this.write = q;
	                            return this.inflate_flush(z, r);
	                        }
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    if ((((~b) >>> 16) & 0xffff) !== (b & 0xffff)) {
	                        this.mode = 9;
	                        z.msg = "invalid stored block lengths";
	                        r = -3;
	                        this.bitb = b;
	                        this.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        this.write = q;
	                        return this.inflate_flush(z, r);
	                    }
	                    left = (b & 0xffff);
	                    b = k = 0;
	                    this.mode = left !== 0 ? 2 : (this.last !== 0 ? 7 : 0);
	                    break;
	                case 2:
	                    if (n === 0) {
	                        this.bitb = b;
	                        this.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        this.write = q;
	                        return this.inflate_flush(z, r);
	                    }
	                    if (m === 0) {
	                        if (q === this.end && this.read !== 0) {
	                            q = 0;
	                            m = (q < this.read ? this.read - q - 1 : this.end - q);
	                        }
	                        if (m === 0) {
	                            this.write = q;
	                            r = this.inflate_flush(z, r);
	                            q = this.write;
	                            m = (q < this.read ? this.read - q - 1 : this.end - q);
	                            if (q === this.end && this.read !== 0) {
	                                q = 0;
	                                m = (q < this.read ? this.read - q - 1 : this.end - q);
	                            }
	                            if (m === 0) {
	                                this.bitb = b;
	                                this.bitk = k;
	                                z.avail_in = n;
	                                z.total_in += p - z.next_in_index;
	                                z.next_in_index = p;
	                                this.write = q;
	                                return this.inflate_flush(z, r);
	                            }
	                        }
	                    }
	                    r = 0;
	                    t = left;
	                    if (t > n) {
	                        t = n;
	                    }
	                    if (t > m) {
	                        t = m;
	                    }
	                    this.window.set(z.read_buf(p, t), q);
	                    p += t;
	                    n -= t;
	                    q += t;
	                    m -= t;
	                    left -= t;
	                    if (left !== 0) {
	                        break;
	                    }
	                    this.mode = this.last !== 0 ? 7 : 0;
	                    break;
	                case 3:
	                    while (k < (14)) {
	                        if (n !== 0) {
	                            r = 0;
	                        }
	                        else {
	                            this.bitb = b;
	                            this.bitk = k;
	                            z.avail_in = n;
	                            z.total_in += p - z.next_in_index;
	                            z.next_in_index = p;
	                            this.write = q;
	                            return this.inflate_flush(z, r);
	                        }
	                        n--;
	                        b |= (z.next_in[p++] & 0xff) << k;
	                        k += 8;
	                    }
	                    table = t = (b & 0x3fff);
	                    if ((t & 0x1f) > 29 || ((t >> 5) & 0x1f) > 29) {
	                        this.mode = 9;
	                        z.msg = "too many length or distance symbols";
	                        r = -3;
	                        this.bitb = b;
	                        this.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        this.write = q;
	                        return this.inflate_flush(z, r);
	                    }
	                    t = 258 + (t & 0x1f) + ((t >> 5) & 0x1f);
	                    for (i = 0; i < t; i++) {
	                        blens[i] = 0;
	                    }
	                    b >>>= (14);
	                    k -= (14);
	                    index = 0;
	                    this.mode = 4;
	                    while (index < 4 + (table >>> 10)) {
	                        while (k < (3)) {
	                            if (n !== 0) {
	                                r = 0;
	                            }
	                            else {
	                                this.bitb = b;
	                                this.bitk = k;
	                                z.avail_in = n;
	                                z.total_in += p - z.next_in_index;
	                                z.next_in_index = p;
	                                this.write = q;
	                                return this.inflate_flush(z, r);
	                            }
	                            n--;
	                            b |= (z.next_in[p++] & 0xff) << k;
	                            k += 8;
	                        }
	                        blens[border[index++]] = b & 7;
	                        b >>>= (3);
	                        k -= (3);
	                    }
	                    while (index < 19) {
	                        blens[border[index++]] = 0;
	                    }
	                    bb[0] = 7;
	                    t = inflate_trees_bits(blens, bb, tb, hufts, z);
	                    if (t !== 0) {
	                        r = t;
	                        if (r === -3) {
	                            this.mode = 9;
	                        }
	                        this.bitb = b;
	                        this.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        this.write = q;
	                        return this.inflate_flush(z, r);
	                    }
	                    index = 0;
	                    this.mode = 5;
	                    while (true) {
	                        t = table;
	                        if (index >= 258 + (t & 0x1f) + ((t >> 5) & 0x1f)) {
	                            break;
	                        }
	                        let j, c;
	                        t = bb[0];
	                        while (k < (t)) {
	                            if (n !== 0) {
	                                r = 0;
	                            }
	                            else {
	                                this.bitb = b;
	                                this.bitk = k;
	                                z.avail_in = n;
	                                z.total_in += p - z.next_in_index;
	                                z.next_in_index = p;
	                                this.write = q;
	                                return this.inflate_flush(z, r);
	                            }
	                            n--;
	                            b |= (z.next_in[p++] & 0xff) << k;
	                            k += 8;
	                        }
	                        t = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 1];
	                        c = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 2];
	                        if (c < 16) {
	                            b >>>= (t);
	                            k -= (t);
	                            blens[index++] = c;
	                        }
	                        else {
	                            i = c === 18 ? 7 : c - 14;
	                            j = c === 18 ? 11 : 3;
	                            while (k < (t + i)) {
	                                if (n !== 0) {
	                                    r = 0;
	                                }
	                                else {
	                                    this.bitb = b;
	                                    this.bitk = k;
	                                    z.avail_in = n;
	                                    z.total_in += p - z.next_in_index;
	                                    z.next_in_index = p;
	                                    this.write = q;
	                                    return this.inflate_flush(z, r);
	                                }
	                                n--;
	                                b |= (z.next_in[p++] & 0xff) << k;
	                                k += 8;
	                            }
	                            b >>>= (t);
	                            k -= (t);
	                            j += (b & inflate_mask[i]);
	                            b >>>= (i);
	                            k -= (i);
	                            i = index;
	                            t = table;
	                            if (i + j > 258 + (t & 0x1f) + ((t >> 5) & 0x1f) || (c === 16 && i < 1)) {
	                                this.mode = 9;
	                                z.msg = "invalid bit length repeat";
	                                r = -3;
	                                this.bitb = b;
	                                this.bitk = k;
	                                z.avail_in = n;
	                                z.total_in += p - z.next_in_index;
	                                z.next_in_index = p;
	                                this.write = q;
	                                return this.inflate_flush(z, r);
	                            }
	                            c = c === 16 ? blens[i - 1] : 0;
	                            do {
	                                blens[i++] = c;
	                            } while (--j !== 0);
	                            index = i;
	                        }
	                    }
	                    tb[0] = -1;
	                    const bl_ = [9];
	                    const bd_ = [6];
	                    const tl_ = [0];
	                    const td_ = [0];
	                    t = inflate_trees_dynamic(257 + (t & 0x1f), 1 + ((t >> 5) & 0x1f), blens, bl_, bd_, tl_, td_, hufts, z);
	                    if (t !== 0) {
	                        if (t === -3) {
	                            this.mode = 9;
	                        }
	                        r = t;
	                        this.bitb = b;
	                        this.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        this.write = q;
	                        return this.inflate_flush(z, r);
	                    }
	                    codes.init(bl_[0], bd_[0], hufts, tl_[0], hufts, td_[0]);
	                    this.mode = 6;
	                case 6:
	                    this.bitb = b;
	                    this.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    this.write = q;
	                    r = codes.proc(this, z, r);
	                    if (r !== 1) {
	                        return this.inflate_flush(z, r);
	                    }
	                    r = 0;
	                    p = z.next_in_index;
	                    n = z.avail_in;
	                    b = this.bitb;
	                    k = this.bitk;
	                    q = this.write;
	                    m = (q < this.read ? this.read - q - 1 : this.end - q);
	                    if (this.last === 0) {
	                        this.mode = 0;
	                        break;
	                    }
	                    this.mode = 7;
	                case 7:
	                    this.write = q;
	                    r = this.inflate_flush(z, r);
	                    q = this.write;
	                    m = (q < this.read ? this.read - q - 1 : this.end - q);
	                    if (this.read !== this.write) {
	                        this.bitb = b;
	                        this.bitk = k;
	                        z.avail_in = n;
	                        z.total_in += p - z.next_in_index;
	                        z.next_in_index = p;
	                        this.write = q;
	                        return this.inflate_flush(z, r);
	                    }
	                    this.mode = 8;
	                case 8:
	                    r = 1;
	                    this.bitb = b;
	                    this.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    this.write = q;
	                    return this.inflate_flush(z, r);
	                case 9:
	                    r = -3;
	                    this.bitb = b;
	                    this.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    this.write = q;
	                    return this.inflate_flush(z, r);
	                default:
	                    r = -2;
	                    this.bitb = b;
	                    this.bitk = k;
	                    z.avail_in = n;
	                    z.total_in += p - z.next_in_index;
	                    z.next_in_index = p;
	                    this.write = q;
	                    return this.inflate_flush(z, r);
	            }
	        }
	    }
	    set_dictionary(d, start, n) {
	        this.window.set(d.subarray(start, start + n), 0);
	        this.read = this.write = n;
	    }
	}

	class Inflate {
	    constructor(blocksOnly) {
	        this.isGZip = false;
	        this.method = 0;
	        this.gflags = 0;
	        this.name = "";
	        this.mtime = 0;
	        this.xlen = 0;
	        this.dictChecksum = 0;
	        this.fullChecksum = 0;
	        this.inflatedSize = 0;
	        this.wbits = 0;
	        this.wbits = 15;
	        this.blocks = new InfBlocks(1 << this.wbits);
	        this.mode = blocksOnly ? 22 : 0;
	    }
	    get isComplete() {
	        const { blocks } = this;
	        const blocksComplete = (blocks.mode === 0 || blocks.mode === 8) && blocks.bitb === 0 && blocks.bitk === 0;
	        return this.mode === 31 && blocksComplete;
	    }
	    get fileName() {
	        return this.name;
	    }
	    get modDate() {
	        if (this.mtime === 0) {
	            return undefined;
	        }
	        return new Date(this.mtime * 1000);
	    }
	    get checksum() {
	        return this.fullChecksum;
	    }
	    get fullSize() {
	        return this.inflatedSize;
	    }
	    get containerFormat() {
	        return (this.isGZip) ? 2 : ((this.method === 0) ? 0 : 1);
	    }
	    inflate(z) {
	        let b;
	        if (!z || !z.next_in) {
	            return -2;
	        }
	        const f = 0;
	        let r = -5;
	        while (true) {
	            switch (this.mode) {
	                case 0:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    b = z.next_in[z.next_in_index];
	                    if (b !== GZIP_ID1) {
	                        this.mode = 2;
	                        break;
	                    }
	                    this.mode = 1;
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    z.next_in_index++;
	                case 1:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    b = z.next_in[z.next_in_index++];
	                    if (b !== GZIP_ID2) {
	                        this.mode = 32;
	                        z.msg = "invalid gzip id";
	                        break;
	                    }
	                    this.isGZip = true;
	                    this.mode = 2;
	                case 2:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    this.method = z.next_in[z.next_in_index++];
	                    if ((this.method & 0xf) !== Z_DEFLATED) {
	                        this.mode = 32;
	                        z.msg = "unknown compression method";
	                        break;
	                    }
	                    if ((this.method >> 4) + 8 > this.wbits) {
	                        this.mode = 32;
	                        z.msg = "invalid window size";
	                        break;
	                    }
	                    this.mode = 3;
	                case 3:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    b = (z.next_in[z.next_in_index++]) & 0xff;
	                    if (this.isGZip) {
	                        this.gflags = b;
	                        this.mode = 9;
	                        break;
	                    }
	                    if ((((this.method << 8) + b) % 31) !== 0) {
	                        this.mode = 32;
	                        z.msg = "incorrect header check";
	                        break;
	                    }
	                    if ((b & PRESET_DICT) === 0) {
	                        this.mode = 22;
	                        break;
	                    }
	                    this.mode = 4;
	                case 4:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    this.dictChecksum = ((z.next_in[z.next_in_index++] & 0xff) << 24) & 0xff000000;
	                    this.mode = 5;
	                case 5:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    this.dictChecksum |= ((z.next_in[z.next_in_index++] & 0xff) << 16) & 0xff0000;
	                    this.mode = 6;
	                case 6:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    this.dictChecksum |= ((z.next_in[z.next_in_index++] & 0xff) << 8) & 0xff00;
	                    this.mode = 7;
	                case 7:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    this.dictChecksum |= (z.next_in[z.next_in_index++] & 0xff);
	                    this.mode = 8;
	                    return 2;
	                case 8:
	                    this.mode = 32;
	                    z.msg = "need dictionary";
	                    return -2;
	                case 9:
	                case 10:
	                case 11:
	                case 12:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    b = z.next_in[z.next_in_index++] & 0xff;
	                    this.mtime = (this.mtime >>> 8) | (b << 24);
	                    if (this.mode !== 12) {
	                        this.mode++;
	                        break;
	                    }
	                    this.mode = 13;
	                case 13:
	                case 14:
	                case 20:
	                case 21:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    z.next_in_index++;
	                    if (this.mode === 14) {
	                        if (this.gflags & 4) {
	                            this.mode = 15;
	                        }
	                        else if (this.gflags & 8) {
	                            this.mode = 18;
	                        }
	                        else if (this.gflags & 16) {
	                            this.mode = 19;
	                        }
	                        else if (this.gflags & 2) {
	                            this.mode = 20;
	                        }
	                        else {
	                            this.mode = 22;
	                        }
	                    }
	                    else {
	                        this.mode++;
	                    }
	                    break;
	                case 15:
	                case 16:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    b = (z.next_in[z.next_in_index++]) & 0xff;
	                    this.xlen = (this.xlen >>> 8) | (b << 24);
	                    if (this.mode === 15) {
	                        break;
	                    }
	                    this.xlen = this.xlen >>> 16;
	                case 17:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    z.next_in_index++;
	                    this.xlen--;
	                    if (this.xlen === 0) {
	                        if (this.gflags & 8) {
	                            this.mode = 18;
	                        }
	                        else if (this.gflags & 16) {
	                            this.mode = 19;
	                        }
	                        else if (this.gflags & 2) {
	                            this.mode = 20;
	                        }
	                        else {
	                            this.mode = 22;
	                        }
	                    }
	                    break;
	                case 18:
	                case 19:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    b = (z.next_in[z.next_in_index++]) & 0xff;
	                    if (b !== 0) {
	                        if (this.mode === 18) {
	                            this.name += String.fromCharCode(b);
	                        }
	                    }
	                    else {
	                        if ((this.mode !== 19) && (this.gflags & 16)) {
	                            this.mode = 19;
	                        }
	                        else if (this.gflags & 2) {
	                            this.mode = 20;
	                        }
	                        else {
	                            this.mode = 22;
	                        }
	                    }
	                    break;
	                case 22:
	                    r = this.blocks.proc(z, r);
	                    if (r === -3) {
	                        this.mode = 32;
	                        break;
	                    }
	                    if (r !== 1) {
	                        return r;
	                    }
	                    r = f;
	                    this.blocks.reset();
	                    if (this.method === 0) {
	                        this.mode = 31;
	                        break;
	                    }
	                    this.mode = 23;
	                case 23:
	                case 24:
	                case 25:
	                case 26:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    b = (z.next_in[z.next_in_index++]) & 0xff;
	                    if (this.isGZip) {
	                        this.fullChecksum = (this.fullChecksum >>> 8) | (b << 24);
	                    }
	                    else {
	                        this.fullChecksum = (this.fullChecksum << 8) | b;
	                    }
	                    this.mode++;
	                    if (this.mode === 27 && (!this.isGZip)) {
	                        this.mode = 31;
	                    }
	                    break;
	                case 27:
	                case 28:
	                case 29:
	                case 30:
	                    if (z.avail_in === 0) {
	                        return r;
	                    }
	                    r = f;
	                    z.avail_in--;
	                    z.total_in++;
	                    b = (z.next_in[z.next_in_index++]) & 0xff;
	                    this.inflatedSize = (this.inflatedSize >>> 8) | (b << 24);
	                    this.mode++;
	                    break;
	                case 31:
	                    return 1;
	                case 32:
	                    return -3;
	                default:
	                    return -2;
	            }
	        }
	    }
	    inflateSetDictionary(dictSource) {
	        if (this.mode !== 8) {
	            return -2;
	        }
	        const dictionary = u8ArrayFromBufferSource(dictSource);
	        if (!dictionary) {
	            return -3;
	        }
	        let index = 0;
	        let length = dictionary.byteLength;
	        if (length >= (1 << this.wbits)) {
	            length = (1 << this.wbits) - 1;
	            index = dictionary.byteLength - length;
	        }
	        const checksum = adler32(dictionary);
	        if (checksum !== this.dictChecksum) {
	            return -3;
	        }
	        this.blocks.set_dictionary(dictionary, index, length);
	        this.mode = 22;
	        return 0;
	    }
	}

	class Inflater {
	    constructor(options) {
	        var _a, _b;
	        const raw = (_a = options) === null || _a === void 0 ? void 0 : _a.raw;
	        if (raw !== undefined && raw !== true && raw !== false) {
	            throw new TypeError("options.raw must be undefined or true or false");
	        }
	        const blocksOnly = raw === undefined ? false : raw;
	        const dictionary = (_b = options) === null || _b === void 0 ? void 0 : _b.dictionary;
	        if (dictionary !== undefined) {
	            if (blocksOnly) {
	                throw new RangeError("options.dictionary cannot be set when options.raw is true");
	            }
	            if (u8ArrayFromBufferSource(dictionary) === undefined) {
	                throw new TypeError("options.dictionary must be undefined or a buffer or a buffer view");
	            }
	            this.customDict = dictionary;
	        }
	        this.inflate = new Inflate(blocksOnly);
	        this.z = new ZStream();
	    }
	    append(data) {
	        const chunk = u8ArrayFromBufferSource(data);
	        if (!(chunk instanceof Uint8Array)) {
	            throw new TypeError("data must be an ArrayBuffer or buffer view");
	        }
	        if (chunk.length === 0) {
	            return [];
	        }
	        const { inflate, z } = this;
	        const outBuffers = [];
	        let nomoreinput = false;
	        z.append(chunk);
	        do {
	            z.next_out_index = 0;
	            z.avail_out = OUTPUT_BUFSIZE;
	            if ((z.avail_in === 0) && (!nomoreinput)) {
	                z.next_in_index = 0;
	                nomoreinput = true;
	            }
	            const err = inflate.inflate(z);
	            if (nomoreinput && (err === -5)) {
	                if (z.avail_in !== 0) {
	                    throw new Error("inflate error: bad input");
	                }
	            }
	            else if (err === 2) {
	                if (this.customDict) {
	                    const dictErr = inflate.inflateSetDictionary(this.customDict);
	                    if (dictErr !== 0) {
	                        throw new Error("Custom dictionary is not valid for this data");
	                    }
	                }
	                else {
	                    throw new Error("Custom dictionary required for this data");
	                }
	            }
	            else if (err !== 0 && err !== 1) {
	                throw new Error("inflate error: " + z.msg);
	            }
	            if ((nomoreinput || err === 1) && (z.avail_in === chunk.length)) {
	                throw new Error("inflate error: bad input data");
	            }
	            if (z.next_out_index) {
	                const nextBuffer = new Uint8Array(z.next_out.subarray(0, z.next_out_index));
	                const useCRC = inflate.containerFormat === 2;
	                if (this.checksum === undefined) {
	                    this.checksum = useCRC ? 0 : 1;
	                }
	                if (useCRC) {
	                    this.checksum = crc32(nextBuffer, this.checksum);
	                }
	                else {
	                    this.checksum = adler32(nextBuffer, this.checksum);
	                }
	                outBuffers.push(nextBuffer);
	            }
	        } while (z.avail_in > 0 || z.avail_out === 0);
	        return outBuffers;
	    }
	    finish() {
	        const storedChecksum = this.inflate.checksum;
	        const storedSize = this.inflate.fullSize;
	        const complete = this.inflate.isComplete;
	        const checksum = (storedChecksum === 0) ? "unchecked" : (storedChecksum === this.checksum ? "match" : "mismatch");
	        const fileSize = (storedSize === 0) ? "unchecked" : (storedSize === this.z.total_out ? "match" : "mismatch");
	        const success = complete && checksum !== "mismatch" && fileSize !== "mismatch";
	        const fileName = this.inflate.fileName;
	        const modDate = this.inflate.modDate;
	        return {
	            success,
	            complete,
	            checksum,
	            fileSize,
	            fileName,
	            modDate
	        };
	    }
	}
	function inflate(data, dictionary) {
	    const input = u8ArrayFromBufferSource(data);
	    if (!(input instanceof Uint8Array)) {
	        throw new TypeError("data must be an ArrayBuffer or buffer view");
	    }
	    if (input.length < 2) {
	        throw new Error("data buffer is too small");
	    }
	    const options = {
	        dictionary
	    };
	    const [method, flag] = input;
	    const startsWithIdent = (method === 0x78 && ((((method << 8) + flag) % 31) === 0)) ||
	        (method === 0x1F && flag === 0x8B);
	    options.raw = !startsWithIdent;
	    const inflater = new Inflater(options);
	    const buffers = inflater.append(input);
	    const result = inflater.finish();
	    if (!result.success) {
	        if (!result.complete) {
	            throw new Error("Unexpected EOF during decompression");
	        }
	        if (result.checksum === "mismatch") {
	            throw new Error("Data integrity check failed");
	        }
	        if (result.fileSize === "mismatch") {
	            throw new Error("Data size check failed");
	        }
	        throw new Error("Decompression error");
	    }
	    return mergeBuffers(buffers);
	}

	const D_CODES = 30;
	const BL_CODES = 19;
	const LENGTH_CODES = 29;
	const LITERALS = 256;
	const L_CODES = (LITERALS + 1 + LENGTH_CODES);
	const HEAP_SIZE = (2 * L_CODES + 1);
	const MAX_BL_BITS = 7;
	const _dist_code = [0, 1, 2, 3, 4, 4, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
	    10, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
	    12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
	    13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,
	    14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,
	    14, 14, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 0, 16, 17, 18, 18, 19, 19,
	    20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	    24, 24, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
	    26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
	    27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
	    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29,
	    29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29,
	    29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29];
	class Tree {
	    constructor(tree, desc) {
	        this.dyn_tree = tree;
	        this.stat_desc = desc;
	        this.max_code = 0;
	    }
	    gen_bitlen(s) {
	        var tree = this.dyn_tree;
	        var stree = this.stat_desc.static_tree;
	        var extra = this.stat_desc.extra_bits;
	        var base = this.stat_desc.extra_base;
	        var max_length = this.stat_desc.max_length;
	        var h;
	        var n, m;
	        var bits;
	        var xbits;
	        var f;
	        var overflow = 0;
	        for (bits = 0; bits <= 15; bits++)
	            s.bl_count[bits] = 0;
	        tree[s.heap[s.heap_max] * 2 + 1] = 0;
	        for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
	            n = s.heap[h];
	            bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
	            if (bits > max_length) {
	                bits = max_length;
	                overflow++;
	            }
	            tree[n * 2 + 1] = bits;
	            if (n > this.max_code)
	                continue;
	            s.bl_count[bits]++;
	            xbits = 0;
	            if (n >= base)
	                xbits = extra[n - base];
	            f = tree[n * 2];
	            s.opt_len += f * (bits + xbits);
	            if (stree)
	                s.static_len += f * (stree[n * 2 + 1] + xbits);
	        }
	        if (overflow === 0)
	            return;
	        do {
	            bits = max_length - 1;
	            while (s.bl_count[bits] === 0)
	                bits--;
	            s.bl_count[bits]--;
	            s.bl_count[bits + 1] += 2;
	            s.bl_count[max_length]--;
	            overflow -= 2;
	        } while (overflow > 0);
	        for (bits = max_length; bits !== 0; bits--) {
	            n = s.bl_count[bits];
	            while (n !== 0) {
	                m = s.heap[--h];
	                if (m > this.max_code)
	                    continue;
	                if (tree[m * 2 + 1] != bits) {
	                    s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
	                    tree[m * 2 + 1] = bits;
	                }
	                n--;
	            }
	        }
	    }
	    bi_reverse(code, len) {
	        let res = 0;
	        do {
	            res |= code & 1;
	            code >>>= 1;
	            res <<= 1;
	        } while (--len > 0);
	        return res >>> 1;
	    }
	    gen_codes(tree, max_code, bl_count) {
	        const next_code = new Uint16Array(15 + 1);
	        let code = 0;
	        for (let bits = 1; bits <= 15; bits++) {
	            next_code[bits] = code = ((code + bl_count[bits - 1]) << 1);
	        }
	        for (let n = 0; n <= max_code; n++) {
	            const len = tree[n * 2 + 1];
	            if (len === 0)
	                continue;
	            tree[n * 2] = this.bi_reverse(next_code[len]++, len);
	        }
	    }
	    build_tree(s) {
	        var tree = this.dyn_tree;
	        var stree = this.stat_desc.static_tree;
	        var elems = this.stat_desc.elems;
	        var n, m;
	        var max_code = -1;
	        var node;
	        s.heap_len = 0;
	        s.heap_max = HEAP_SIZE;
	        for (n = 0; n < elems; n++) {
	            if (tree[n * 2] !== 0) {
	                s.heap[++s.heap_len] = max_code = n;
	                s.depth[n] = 0;
	            }
	            else {
	                tree[n * 2 + 1] = 0;
	            }
	        }
	        while (s.heap_len < 2) {
	            node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
	            tree[node * 2] = 1;
	            s.depth[node] = 0;
	            s.opt_len--;
	            if (stree)
	                s.static_len -= stree[node * 2 + 1];
	        }
	        this.max_code = max_code;
	        for (n = Math.floor(s.heap_len / 2); n >= 1; n--)
	            s.pqdownheap(tree, n);
	        node = elems;
	        do {
	            n = s.heap[1];
	            s.heap[1] = s.heap[s.heap_len--];
	            s.pqdownheap(tree, 1);
	            m = s.heap[1];
	            s.heap[--s.heap_max] = n;
	            s.heap[--s.heap_max] = m;
	            tree[node * 2] = (tree[n * 2] + tree[m * 2]);
	            s.depth[node] = Math.max(s.depth[n], s.depth[m]) + 1;
	            tree[n * 2 + 1] = tree[m * 2 + 1] = node;
	            s.heap[1] = node++;
	            s.pqdownheap(tree, 1);
	        } while (s.heap_len >= 2);
	        s.heap[--s.heap_max] = s.heap[1];
	        this.gen_bitlen(s);
	        this.gen_codes(tree, this.max_code, s.bl_count);
	    }
	    static d_code(dist) {
	        return (dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)]);
	    }
	    ;
	}
	Tree._length_code = [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16,
	    16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20,
	    20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
	    22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25,
	    25, 25, 25, 25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
	    26, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28];
	Tree.base_length = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 0];
	Tree.base_dist = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096, 6144, 8192, 12288, 16384,
	    24576];
	Tree.extra_lbits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
	Tree.extra_dbits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
	Tree.extra_blbits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];
	Tree.bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
	class StaticTree {
	    constructor(static_tree, extra_bits, extra_base, elems, max_length) {
	        this.static_tree = static_tree;
	        this.extra_bits = extra_bits;
	        this.extra_base = extra_base;
	        this.elems = elems;
	        this.max_length = max_length;
	    }
	}
	StaticTree.static_ltree = new Uint16Array([12, 8, 140, 8, 76, 8, 204, 8, 44, 8, 172, 8, 108, 8, 236, 8, 28, 8, 156, 8, 92, 8, 220, 8, 60, 8, 188, 8, 124, 8, 252, 8, 2, 8,
	    130, 8, 66, 8, 194, 8, 34, 8, 162, 8, 98, 8, 226, 8, 18, 8, 146, 8, 82, 8, 210, 8, 50, 8, 178, 8, 114, 8, 242, 8, 10, 8, 138, 8, 74, 8, 202, 8, 42,
	    8, 170, 8, 106, 8, 234, 8, 26, 8, 154, 8, 90, 8, 218, 8, 58, 8, 186, 8, 122, 8, 250, 8, 6, 8, 134, 8, 70, 8, 198, 8, 38, 8, 166, 8, 102, 8, 230, 8,
	    22, 8, 150, 8, 86, 8, 214, 8, 54, 8, 182, 8, 118, 8, 246, 8, 14, 8, 142, 8, 78, 8, 206, 8, 46, 8, 174, 8, 110, 8, 238, 8, 30, 8, 158, 8, 94, 8,
	    222, 8, 62, 8, 190, 8, 126, 8, 254, 8, 1, 8, 129, 8, 65, 8, 193, 8, 33, 8, 161, 8, 97, 8, 225, 8, 17, 8, 145, 8, 81, 8, 209, 8, 49, 8, 177, 8, 113,
	    8, 241, 8, 9, 8, 137, 8, 73, 8, 201, 8, 41, 8, 169, 8, 105, 8, 233, 8, 25, 8, 153, 8, 89, 8, 217, 8, 57, 8, 185, 8, 121, 8, 249, 8, 5, 8, 133, 8,
	    69, 8, 197, 8, 37, 8, 165, 8, 101, 8, 229, 8, 21, 8, 149, 8, 85, 8, 213, 8, 53, 8, 181, 8, 117, 8, 245, 8, 13, 8, 141, 8, 77, 8, 205, 8, 45, 8,
	    173, 8, 109, 8, 237, 8, 29, 8, 157, 8, 93, 8, 221, 8, 61, 8, 189, 8, 125, 8, 253, 8, 19, 9, 275, 9, 147, 9, 403, 9, 83, 9, 339, 9, 211, 9, 467, 9,
	    51, 9, 307, 9, 179, 9, 435, 9, 115, 9, 371, 9, 243, 9, 499, 9, 11, 9, 267, 9, 139, 9, 395, 9, 75, 9, 331, 9, 203, 9, 459, 9, 43, 9, 299, 9, 171, 9,
	    427, 9, 107, 9, 363, 9, 235, 9, 491, 9, 27, 9, 283, 9, 155, 9, 411, 9, 91, 9, 347, 9, 219, 9, 475, 9, 59, 9, 315, 9, 187, 9, 443, 9, 123, 9, 379,
	    9, 251, 9, 507, 9, 7, 9, 263, 9, 135, 9, 391, 9, 71, 9, 327, 9, 199, 9, 455, 9, 39, 9, 295, 9, 167, 9, 423, 9, 103, 9, 359, 9, 231, 9, 487, 9, 23,
	    9, 279, 9, 151, 9, 407, 9, 87, 9, 343, 9, 215, 9, 471, 9, 55, 9, 311, 9, 183, 9, 439, 9, 119, 9, 375, 9, 247, 9, 503, 9, 15, 9, 271, 9, 143, 9,
	    399, 9, 79, 9, 335, 9, 207, 9, 463, 9, 47, 9, 303, 9, 175, 9, 431, 9, 111, 9, 367, 9, 239, 9, 495, 9, 31, 9, 287, 9, 159, 9, 415, 9, 95, 9, 351, 9,
	    223, 9, 479, 9, 63, 9, 319, 9, 191, 9, 447, 9, 127, 9, 383, 9, 255, 9, 511, 9, 0, 7, 64, 7, 32, 7, 96, 7, 16, 7, 80, 7, 48, 7, 112, 7, 8, 7, 72, 7,
	    40, 7, 104, 7, 24, 7, 88, 7, 56, 7, 120, 7, 4, 7, 68, 7, 36, 7, 100, 7, 20, 7, 84, 7, 52, 7, 116, 7, 3, 8, 131, 8, 67, 8, 195, 8, 35, 8, 163, 8,
	    99, 8, 227, 8
	]);
	StaticTree.static_dtree = new Uint16Array([0, 5, 16, 5, 8, 5, 24, 5, 4, 5, 20, 5, 12, 5, 28, 5, 2, 5, 18, 5, 10, 5, 26, 5, 6, 5, 22, 5, 14, 5, 30, 5, 1, 5, 17, 5, 9, 5,
	    25, 5, 5, 5, 21, 5, 13, 5, 29, 5, 3, 5, 19, 5, 11, 5, 27, 5, 7, 5, 23, 5]);
	StaticTree.static_l_desc = new StaticTree(StaticTree.static_ltree, Tree.extra_lbits, LITERALS + 1, L_CODES, 15);
	StaticTree.static_d_desc = new StaticTree(StaticTree.static_dtree, Tree.extra_dbits, 0, D_CODES, 15);
	StaticTree.static_bl_desc = new StaticTree(null, Tree.extra_blbits, 0, BL_CODES, MAX_BL_BITS);

	const makeConfig = (gl, ml, nl, mc, func) => ({
	    good_length: gl,
	    max_lazy: ml,
	    nice_length: nl,
	    max_chain: mc,
	    func
	});
	const config_table = [
	    makeConfig(0, 0, 0, 0, 0),
	    makeConfig(4, 4, 8, 4, 1),
	    makeConfig(4, 5, 16, 8, 1),
	    makeConfig(4, 6, 32, 32, 1),
	    makeConfig(4, 4, 16, 16, 2),
	    makeConfig(8, 16, 32, 32, 2),
	    makeConfig(8, 16, 128, 128, 2),
	    makeConfig(8, 32, 128, 256, 2),
	    makeConfig(32, 128, 258, 1024, 2),
	    makeConfig(32, 258, 258, 4096, 2)
	];

	function smaller(tree, n, m, depth) {
	    const tn2 = tree[n * 2];
	    const tm2 = tree[m * 2];
	    return (tn2 < tm2 || (tn2 == tm2 && depth[n] <= depth[m]));
	}
	const END_BLOCK = 256;
	const REP_3_6 = 16;
	const REPZ_3_10 = 17;
	const REPZ_11_138 = 18;
	const STORED_BLOCK = 0;
	const STATIC_TREES = 1;
	const DYN_TREES = 2;
	const MIN_MATCH = 3;
	const MAX_MATCH = 258;
	const MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);
	const hash_bits = 8 + 7;
	const hash_size = 1 << hash_bits;
	const hash_mask = hash_size - 1;
	const hash_shift = Math.floor((hash_bits + MIN_MATCH - 1) / MIN_MATCH);
	const lit_bufsize = 1 << (8 + 6);
	const pending_buf_size = lit_bufsize * 4;
	const d_buf = Math.floor(lit_bufsize / 2);
	const l_buf = (1 + 2) * lit_bufsize;
	const window_size = 2 * 32768;
	class Deflate {
	    constructor(strm, level = 6, strategy = 0) {
	        this.status = 1;
	        this.pending_buf = new Uint8Array(pending_buf_size);
	        this.pending = 0;
	        this.pending_out = 0;
	        this.last_flush = 0;
	        this.window = new Uint8Array(window_size);
	        this.prev = new Uint16Array(32768);
	        this.head = new Uint16Array(hash_size);
	        this.ins_h = 0;
	        this.block_start = 0;
	        this.match_length = MIN_MATCH - 1;
	        this.match_available = false;
	        this.strstart = 0;
	        this.match_start = 0;
	        this.lookahead = 0;
	        this.prev_length = MIN_MATCH - 1;
	        this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
	        this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
	        this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
	        this.l_desc = new Tree(this.dyn_ltree, StaticTree.static_l_desc);
	        this.d_desc = new Tree(this.dyn_dtree, StaticTree.static_d_desc);
	        this.bl_desc = new Tree(this.bl_tree, StaticTree.static_bl_desc);
	        this.depth = new Uint16Array(2 * L_CODES + 1);
	        this.last_lit = 0;
	        this.matches = 0;
	        this.opt_len = 0;
	        this.static_len = 0;
	        this.last_eob_len = 8;
	        this.bi_buf = 0;
	        this.bi_valid = 0;
	        this.bl_count = new Uint16Array(15 + 1);
	        this.heap = new Uint16Array(2 * L_CODES + 1);
	        this.heap_len = 0;
	        this.heap_max = HEAP_SIZE;
	        if (level < 0 || level > 9 || strategy < 0 || strategy > 2) {
	            throw RangeError("level or strategy is out of range");
	        }
	        this.strm = strm;
	        this.level = level;
	        this.strategy = strategy;
	        strm.msg = "";
	        strm.total_in = strm.total_out = 0;
	        this.init_block();
	        for (let i = 0; i < hash_size; ++i) {
	            this.head[i] = 0;
	        }
	        this.max_lazy_match = config_table[level].max_lazy;
	        this.good_match = config_table[level].good_length;
	        this.nice_match = config_table[level].nice_length;
	        this.max_chain_length = config_table[level].max_chain;
	    }
	    init_block() {
	        for (let i = 0; i < L_CODES; i++)
	            this.dyn_ltree[i * 2] = 0;
	        for (let i = 0; i < D_CODES; i++)
	            this.dyn_dtree[i * 2] = 0;
	        for (let i = 0; i < BL_CODES; i++)
	            this.bl_tree[i * 2] = 0;
	        this.dyn_ltree[END_BLOCK * 2] = 1;
	        this.opt_len = this.static_len = 0;
	        this.last_lit = this.matches = 0;
	    }
	    pqdownheap(tree, k) {
	        const heap = this.heap;
	        const v = heap[k];
	        let j = k << 1;
	        while (j <= this.heap_len) {
	            if (j < this.heap_len && smaller(tree, heap[j + 1], heap[j], this.depth)) {
	                j++;
	            }
	            if (smaller(tree, v, heap[j], this.depth))
	                break;
	            heap[k] = heap[j];
	            k = j;
	            j <<= 1;
	        }
	        heap[k] = v;
	    }
	    ;
	    scan_tree(tree, max_code) {
	        var prevlen = -1;
	        var curlen;
	        var nextlen = tree[0 * 2 + 1];
	        var count = 0;
	        var max_count = 7;
	        var min_count = 4;
	        if (nextlen === 0) {
	            max_count = 138;
	            min_count = 3;
	        }
	        tree[(max_code + 1) * 2 + 1] = 0xffff;
	        for (let n = 0; n <= max_code; n++) {
	            curlen = nextlen;
	            nextlen = tree[(n + 1) * 2 + 1];
	            if (++count < max_count && curlen == nextlen) {
	                continue;
	            }
	            else if (count < min_count) {
	                this.bl_tree[curlen * 2] += count;
	            }
	            else if (curlen !== 0) {
	                if (curlen != prevlen)
	                    this.bl_tree[curlen * 2]++;
	                this.bl_tree[REP_3_6 * 2]++;
	            }
	            else if (count <= 10) {
	                this.bl_tree[REPZ_3_10 * 2]++;
	            }
	            else {
	                this.bl_tree[REPZ_11_138 * 2]++;
	            }
	            count = 0;
	            prevlen = curlen;
	            if (nextlen === 0) {
	                max_count = 138;
	                min_count = 3;
	            }
	            else if (curlen == nextlen) {
	                max_count = 6;
	                min_count = 3;
	            }
	            else {
	                max_count = 7;
	                min_count = 4;
	            }
	        }
	    }
	    build_bl_tree() {
	        this.scan_tree(this.dyn_ltree, this.l_desc.max_code);
	        this.scan_tree(this.dyn_dtree, this.d_desc.max_code);
	        this.bl_desc.build_tree(this);
	        let max_blindex;
	        for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
	            if (this.bl_tree[Tree.bl_order[max_blindex] * 2 + 1] !== 0)
	                break;
	        }
	        this.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
	        return max_blindex;
	    }
	    put_byte(b) {
	        this.pending_buf[this.pending++] = b;
	    }
	    put_short(w) {
	        this.pending_buf[this.pending++] = w & 0xff;
	        this.pending_buf[this.pending++] = (w >>> 8) & 0xff;
	    }
	    send_bits(value, length) {
	        if (this.bi_valid > 16 - length) {
	            this.bi_buf |= ((value << this.bi_valid) & 0xffff);
	            this.put_short(this.bi_buf);
	            this.bi_buf = value >>> (16 - this.bi_valid);
	            this.bi_valid += length - 16;
	        }
	        else {
	            this.bi_buf |= ((value << this.bi_valid) & 0xffff);
	            this.bi_valid += length;
	        }
	    }
	    send_code(c, tree) {
	        const c2 = c * 2;
	        this.send_bits(tree[c2] & 0xffff, tree[c2 + 1] & 0xffff);
	    }
	    send_tree(tree, max_code) {
	        var prevlen = -1;
	        var curlen;
	        var nextlen = tree[0 * 2 + 1];
	        var count = 0;
	        var max_count = 7;
	        var min_count = 4;
	        if (nextlen === 0) {
	            max_count = 138;
	            min_count = 3;
	        }
	        for (let n = 0; n <= max_code; n++) {
	            curlen = nextlen;
	            nextlen = tree[(n + 1) * 2 + 1];
	            if (++count < max_count && curlen == nextlen) {
	                continue;
	            }
	            else if (count < min_count) {
	                do {
	                    this.send_code(curlen, this.bl_tree);
	                } while (--count !== 0);
	            }
	            else if (curlen !== 0) {
	                if (curlen != prevlen) {
	                    this.send_code(curlen, this.bl_tree);
	                    count--;
	                }
	                this.send_code(REP_3_6, this.bl_tree);
	                this.send_bits(count - 3, 2);
	            }
	            else if (count <= 10) {
	                this.send_code(REPZ_3_10, this.bl_tree);
	                this.send_bits(count - 3, 3);
	            }
	            else {
	                this.send_code(REPZ_11_138, this.bl_tree);
	                this.send_bits(count - 11, 7);
	            }
	            count = 0;
	            prevlen = curlen;
	            if (nextlen === 0) {
	                max_count = 138;
	                min_count = 3;
	            }
	            else if (curlen == nextlen) {
	                max_count = 6;
	                min_count = 3;
	            }
	            else {
	                max_count = 7;
	                min_count = 4;
	            }
	        }
	    }
	    send_all_trees(lcodes, dcodes, blcodes) {
	        this.send_bits(lcodes - 257, 5);
	        this.send_bits(dcodes - 1, 5);
	        this.send_bits(blcodes - 4, 4);
	        for (let rank = 0; rank < blcodes; rank++) {
	            this.send_bits(this.bl_tree[Tree.bl_order[rank] * 2 + 1], 3);
	        }
	        this.send_tree(this.dyn_ltree, lcodes - 1);
	        this.send_tree(this.dyn_dtree, dcodes - 1);
	    }
	    bi_flush() {
	        if (this.bi_valid === 16) {
	            this.put_short(this.bi_buf);
	            this.bi_buf = 0;
	            this.bi_valid = 0;
	        }
	        else if (this.bi_valid >= 8) {
	            this.put_byte(this.bi_buf & 0xff);
	            this.bi_buf >>>= 8;
	            this.bi_valid -= 8;
	        }
	    }
	    _tr_align() {
	        this.send_bits(STATIC_TREES << 1, 3);
	        this.send_code(END_BLOCK, StaticTree.static_ltree);
	        this.bi_flush();
	        if (1 + this.last_eob_len + 10 - this.bi_valid < 9) {
	            this.send_bits(STATIC_TREES << 1, 3);
	            this.send_code(END_BLOCK, StaticTree.static_ltree);
	            this.bi_flush();
	        }
	        this.last_eob_len = 7;
	    }
	    _tr_tally(dist, lc) {
	        this.pending_buf[d_buf + this.last_lit * 2] = (dist >>> 8) & 0xff;
	        this.pending_buf[d_buf + this.last_lit * 2 + 1] = dist & 0xff;
	        this.pending_buf[l_buf + this.last_lit] = lc & 0xff;
	        this.last_lit++;
	        if (dist === 0) {
	            this.dyn_ltree[lc * 2]++;
	        }
	        else {
	            this.matches++;
	            dist--;
	            this.dyn_ltree[(Tree._length_code[lc] + LITERALS + 1) * 2]++;
	            this.dyn_dtree[Tree.d_code(dist) * 2]++;
	        }
	        if ((this.last_lit & 0x1fff) === 0 && this.level > 2) {
	            let out_length = this.last_lit * 8;
	            let in_length = this.strstart - this.block_start;
	            for (let dcode = 0; dcode < D_CODES; dcode++) {
	                out_length += this.dyn_dtree[dcode * 2] * (5 + Tree.extra_dbits[dcode]);
	            }
	            out_length >>>= 3;
	            if ((this.matches < Math.floor(this.last_lit / 2)) && out_length < Math.floor(in_length / 2))
	                return true;
	        }
	        return (this.last_lit === lit_bufsize - 1);
	    }
	    compress_block(ltree, dtree) {
	        let lx = 0;
	        if (this.last_lit !== 0) {
	            do {
	                let dist = ((this.pending_buf[d_buf + lx * 2] << 8) & 0xff00) | (this.pending_buf[d_buf + lx * 2 + 1] & 0xff);
	                let lc = (this.pending_buf[l_buf + lx]) & 0xff;
	                lx++;
	                if (dist === 0) {
	                    this.send_code(lc, ltree);
	                }
	                else {
	                    let code = Tree._length_code[lc];
	                    this.send_code(code + LITERALS + 1, ltree);
	                    let extra = Tree.extra_lbits[code];
	                    if (extra !== 0) {
	                        lc -= Tree.base_length[code];
	                        this.send_bits(lc, extra);
	                    }
	                    dist--;
	                    code = Tree.d_code(dist);
	                    this.send_code(code, dtree);
	                    extra = Tree.extra_dbits[code];
	                    if (extra !== 0) {
	                        dist -= Tree.base_dist[code];
	                        this.send_bits(dist, extra);
	                    }
	                }
	            } while (lx < this.last_lit);
	        }
	        this.send_code(END_BLOCK, ltree);
	        this.last_eob_len = ltree[END_BLOCK * 2 + 1];
	    }
	    bi_windup() {
	        if (this.bi_valid > 8) {
	            this.put_short(this.bi_buf);
	        }
	        else if (this.bi_valid > 0) {
	            this.put_byte(this.bi_buf & 0xff);
	        }
	        this.bi_buf = 0;
	        this.bi_valid = 0;
	    }
	    copy_block(buf, len, header) {
	        this.bi_windup();
	        this.last_eob_len = 8;
	        if (header) {
	            this.put_short(len);
	            this.put_short(~len);
	        }
	        this.pending_buf.set(this.window.subarray(buf, buf + len), this.pending);
	        this.pending += len;
	    }
	    _tr_stored_block(buf, stored_len, eof) {
	        this.send_bits((STORED_BLOCK << 1) + (eof ? 1 : 0), 3);
	        this.copy_block(buf, stored_len, true);
	    }
	    _tr_flush_block(buf, stored_len, eof) {
	        let opt_lenb, static_lenb;
	        let max_blindex = 0;
	        if (this.level > 0) {
	            this.l_desc.build_tree(this);
	            this.d_desc.build_tree(this);
	            max_blindex = this.build_bl_tree();
	            opt_lenb = (this.opt_len + 3 + 7) >>> 3;
	            static_lenb = (this.static_len + 3 + 7) >>> 3;
	            if (static_lenb <= opt_lenb)
	                opt_lenb = static_lenb;
	        }
	        else {
	            opt_lenb = static_lenb = stored_len + 5;
	        }
	        if ((stored_len + 4 <= opt_lenb) && buf !== -1) {
	            this._tr_stored_block(buf, stored_len, eof);
	        }
	        else if (static_lenb == opt_lenb) {
	            this.send_bits((STATIC_TREES << 1) + (eof ? 1 : 0), 3);
	            this.compress_block(StaticTree.static_ltree, StaticTree.static_dtree);
	        }
	        else {
	            this.send_bits((DYN_TREES << 1) + (eof ? 1 : 0), 3);
	            this.send_all_trees(this.l_desc.max_code + 1, this.d_desc.max_code + 1, max_blindex + 1);
	            this.compress_block(this.dyn_ltree, this.dyn_dtree);
	        }
	        this.init_block();
	        if (eof) {
	            this.bi_windup();
	        }
	    }
	    flush_block_only(eof) {
	        this._tr_flush_block(this.block_start >= 0 ? this.block_start : -1, this.strstart - this.block_start, eof);
	        this.block_start = this.strstart;
	        this.strm.flush_pending(this);
	    }
	    fill_window() {
	        do {
	            let more = (window_size - this.lookahead - this.strstart);
	            if (more === 0 && this.strstart === 0 && this.lookahead === 0) {
	                more = 32768;
	            }
	            else if (more === -1) {
	                more--;
	            }
	            else if (this.strstart >= 32768 + 32768 - MIN_LOOKAHEAD) {
	                this.window.set(this.window.subarray(32768, 32768 + 32768), 0);
	                this.match_start -= 32768;
	                this.strstart -= 32768;
	                this.block_start -= 32768;
	                let n = hash_size;
	                let p = n;
	                do {
	                    let m = (this.head[--p] & 0xffff);
	                    this.head[p] = (m >= 32768 ? m - 32768 : 0);
	                } while (--n !== 0);
	                n = 32768;
	                p = n;
	                do {
	                    let m = (this.prev[--p] & 0xffff);
	                    this.prev[p] = (m >= 32768 ? m - 32768 : 0);
	                } while (--n !== 0);
	                more += 32768;
	            }
	            if (this.strm.avail_in === 0)
	                return;
	            const n = this.strm.read_into_buf(this.window, this.strstart + this.lookahead, more);
	            this.lookahead += n;
	            if (this.lookahead >= MIN_MATCH) {
	                this.ins_h = this.window[this.strstart] & 0xff;
	                this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[this.strstart + 1] & 0xff)) & hash_mask;
	            }
	        } while (this.lookahead < MIN_LOOKAHEAD && this.strm.avail_in !== 0);
	    }
	    deflate_stored(flush) {
	        let max_block_size = 0xffff;
	        if (max_block_size > pending_buf_size - 5) {
	            max_block_size = pending_buf_size - 5;
	        }
	        while (true) {
	            if (this.lookahead <= 1) {
	                this.fill_window();
	                if (this.lookahead === 0 && flush === 0)
	                    return 0;
	                if (this.lookahead === 0)
	                    break;
	            }
	            this.strstart += this.lookahead;
	            this.lookahead = 0;
	            let max_start = this.block_start + max_block_size;
	            if (this.strstart === 0 || this.strstart >= max_start) {
	                this.lookahead = (this.strstart - max_start);
	                this.strstart = max_start;
	                this.flush_block_only(false);
	                if (this.strm.avail_out === 0)
	                    return 0;
	            }
	            if (this.strstart - this.block_start >= 32768 - MIN_LOOKAHEAD) {
	                this.flush_block_only(false);
	                if (this.strm.avail_out === 0)
	                    return 0;
	            }
	        }
	        this.flush_block_only(flush === 4);
	        if (this.strm.avail_out === 0)
	            return (flush === 4) ? 2 : 0;
	        return flush === 4 ? 3 : 1;
	    }
	    longest_match(cur_match) {
	        let chain_length = this.max_chain_length;
	        let scan = this.strstart;
	        let best_len = this.prev_length;
	        let limit = this.strstart > (32768 - MIN_LOOKAHEAD) ? this.strstart - (32768 - MIN_LOOKAHEAD) : 0;
	        let _nice_match = this.nice_match;
	        const strend = this.strstart + MAX_MATCH;
	        let scan_end1 = this.window[scan + best_len - 1];
	        let scan_end = this.window[scan + best_len];
	        if (this.prev_length >= this.good_match) {
	            chain_length >>= 2;
	        }
	        if (_nice_match > this.lookahead)
	            _nice_match = this.lookahead;
	        const win = this.window;
	        do {
	            let match = cur_match;
	            if (win[match + best_len] !== scan_end || win[match + best_len - 1] !== scan_end1
	                || win[match] !== win[scan]
	                || win[++match] !== win[scan + 1])
	                continue;
	            scan += 2;
	            match++;
	            do {
	            } while (win[++scan] === win[++match] && win[++scan] === win[++match] && win[++scan] === win[++match]
	                && win[++scan] === win[++match] && win[++scan] === win[++match] && win[++scan] === win[++match]
	                && win[++scan] === win[++match] && win[++scan] === win[++match] && scan < strend);
	            let len = MAX_MATCH - (strend - scan);
	            scan = strend - MAX_MATCH;
	            if (len > best_len) {
	                this.match_start = cur_match;
	                best_len = len;
	                if (len >= _nice_match)
	                    break;
	                scan_end1 = win[scan + best_len - 1];
	                scan_end = win[scan + best_len];
	            }
	        } while ((cur_match = this.prev[cur_match & 32767]) > limit && --chain_length !== 0);
	        if (best_len <= this.lookahead)
	            return best_len;
	        return this.lookahead;
	    }
	    deflate_fast(flush) {
	        let hash_head = 0;
	        let bflush;
	        while (true) {
	            if (this.lookahead < MIN_LOOKAHEAD) {
	                this.fill_window();
	                if (this.lookahead < MIN_LOOKAHEAD && flush === 0) {
	                    return 0;
	                }
	                if (this.lookahead === 0)
	                    break;
	            }
	            if (this.lookahead >= MIN_MATCH) {
	                this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[(this.strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;
	                hash_head = (this.head[this.ins_h] & 0xffff);
	                this.prev[this.strstart & 32767] = this.head[this.ins_h];
	                this.head[this.ins_h] = this.strstart;
	            }
	            if (hash_head !== 0 && ((this.strstart - hash_head) & 0xffff) <= 32768 - MIN_LOOKAHEAD) {
	                if (this.strategy !== 2) {
	                    this.match_length = this.longest_match(hash_head);
	                }
	            }
	            if (this.match_length >= MIN_MATCH) {
	                bflush = this._tr_tally(this.strstart - this.match_start, this.match_length - MIN_MATCH);
	                this.lookahead -= this.match_length;
	                if (this.match_length <= this.max_lazy_match && this.lookahead >= MIN_MATCH) {
	                    this.match_length--;
	                    do {
	                        this.strstart++;
	                        this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[(this.strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;
	                        hash_head = (this.head[this.ins_h] & 0xffff);
	                        this.prev[this.strstart & 32767] = this.head[this.ins_h];
	                        this.head[this.ins_h] = this.strstart;
	                    } while (--this.match_length !== 0);
	                    this.strstart++;
	                }
	                else {
	                    this.strstart += this.match_length;
	                    this.match_length = 0;
	                    this.ins_h = this.window[this.strstart] & 0xff;
	                    this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[this.strstart + 1] & 0xff)) & hash_mask;
	                }
	            }
	            else {
	                bflush = this._tr_tally(0, this.window[this.strstart] & 0xff);
	                this.lookahead--;
	                this.strstart++;
	            }
	            if (bflush) {
	                this.flush_block_only(false);
	                if (this.strm.avail_out === 0)
	                    return 0;
	            }
	        }
	        this.flush_block_only(flush === 4);
	        if (this.strm.avail_out === 0) {
	            if (flush === 4)
	                return 2;
	            else
	                return 0;
	        }
	        return flush === 4 ? 3 : 1;
	    }
	    deflate_slow(flush) {
	        let hash_head = 0;
	        let bflush;
	        let max_insert;
	        let prev_match;
	        while (true) {
	            if (this.lookahead < MIN_LOOKAHEAD) {
	                this.fill_window();
	                if (this.lookahead < MIN_LOOKAHEAD && flush === 0) {
	                    return 0;
	                }
	                if (this.lookahead === 0)
	                    break;
	            }
	            if (this.lookahead >= MIN_MATCH) {
	                this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[this.strstart + (MIN_MATCH - 1)] & 0xff)) & hash_mask;
	                hash_head = (this.head[this.ins_h] & 0xffff);
	                this.prev[this.strstart & 32767] = this.head[this.ins_h];
	                this.head[this.ins_h] = this.strstart;
	            }
	            this.prev_length = this.match_length;
	            prev_match = this.match_start;
	            this.match_length = MIN_MATCH - 1;
	            if (hash_head !== 0 && this.prev_length < this.max_lazy_match && ((this.strstart - hash_head) & 0xffff) <= 32768 - MIN_LOOKAHEAD) {
	                if (this.strategy !== 2) {
	                    this.match_length = this.longest_match(hash_head);
	                }
	                if (this.match_length <= 5 && (this.strategy === 1 || (this.match_length === MIN_MATCH && this.strstart - this.match_start > 4096))) {
	                    this.match_length = MIN_MATCH - 1;
	                }
	            }
	            if (this.prev_length >= MIN_MATCH && this.match_length <= this.prev_length) {
	                max_insert = this.strstart + this.lookahead - MIN_MATCH;
	                bflush = this._tr_tally(this.strstart - 1 - prev_match, this.prev_length - MIN_MATCH);
	                this.lookahead -= this.prev_length - 1;
	                this.prev_length -= 2;
	                do {
	                    if (++this.strstart <= max_insert) {
	                        this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[(this.strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;
	                        hash_head = (this.head[this.ins_h] & 0xffff);
	                        this.prev[this.strstart & 32767] = this.head[this.ins_h];
	                        this.head[this.ins_h] = this.strstart;
	                    }
	                } while (--this.prev_length !== 0);
	                this.match_available = false;
	                this.match_length = MIN_MATCH - 1;
	                this.strstart++;
	                if (bflush) {
	                    this.flush_block_only(false);
	                    if (this.strm.avail_out === 0)
	                        return 0;
	                }
	            }
	            else if (this.match_available) {
	                bflush = this._tr_tally(0, this.window[this.strstart - 1] & 0xff);
	                if (bflush) {
	                    this.flush_block_only(false);
	                }
	                this.strstart++;
	                this.lookahead--;
	                if (this.strm.avail_out === 0)
	                    return 0;
	            }
	            else {
	                this.match_available = true;
	                this.strstart++;
	                this.lookahead--;
	            }
	        }
	        if (this.match_available) {
	            bflush = this._tr_tally(0, this.window[this.strstart - 1] & 0xff);
	            this.match_available = false;
	        }
	        this.flush_block_only(flush === 4);
	        if (this.strm.avail_out === 0) {
	            if (flush === 4)
	                return 2;
	            else
	                return 0;
	        }
	        return flush === 4 ? 3 : 1;
	    }
	    deflateSetDictionary(dictionary) {
	        const dictLength = dictionary.byteLength;
	        let length = dictLength;
	        let n, index = 0;
	        if (!dictionary || this.status !== 1)
	            return -2;
	        if (length < MIN_MATCH)
	            return 0;
	        if (length > 32768 - MIN_LOOKAHEAD) {
	            length = 32768 - MIN_LOOKAHEAD;
	            index = dictLength - length;
	        }
	        this.window.set(dictionary.subarray(index, index + length), 0);
	        this.strstart = length;
	        this.block_start = length;
	        this.ins_h = this.window[0] & 0xff;
	        this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[1] & 0xff)) & hash_mask;
	        for (n = 0; n <= length - MIN_MATCH; n++) {
	            this.ins_h = ((this.ins_h << hash_shift) ^ (this.window[n + (MIN_MATCH - 1)] & 0xff)) & hash_mask;
	            this.prev[n & 32767] = this.head[this.ins_h];
	            this.head[this.ins_h] = n;
	        }
	        return 0;
	    }
	    deflate(flush) {
	        if (flush > 4 || flush < 0) {
	            return -2;
	        }
	        const { strm } = this;
	        if (!strm.next_out || (!strm.next_in && strm.avail_in !== 0) || (this.status === 3 && flush != 4)) {
	            return -2;
	        }
	        if (strm.avail_out === 0) {
	            return -5;
	        }
	        let old_flush = this.last_flush;
	        this.last_flush = flush;
	        if (this.status === 1) {
	            this.status = 2;
	        }
	        if (this.pending !== 0) {
	            strm.flush_pending(this);
	            if (strm.avail_out === 0) {
	                this.last_flush = -1;
	                return 0;
	            }
	        }
	        else if (strm.avail_in === 0 && flush <= old_flush && flush !== 4) {
	            return -5;
	        }
	        if (this.status === 3 && strm.avail_in !== 0) {
	            return -5;
	        }
	        if (strm.avail_in !== 0 || this.lookahead !== 0 || (flush !== 0 && this.status !== 3)) {
	            let bstate;
	            switch (config_table[this.level].func) {
	                case 0:
	                    bstate = this.deflate_stored(flush);
	                    break;
	                case 1:
	                    bstate = this.deflate_fast(flush);
	                    break;
	                case 2:
	                default:
	                    bstate = this.deflate_slow(flush);
	                    break;
	            }
	            if (bstate == 2 || bstate === 3) {
	                this.status = 3;
	            }
	            if (bstate === 0 || bstate === 2) {
	                if (strm.avail_out === 0) {
	                    this.last_flush = -1;
	                }
	                return 0;
	            }
	            if (bstate === 1) {
	                if (flush === 1) {
	                    this._tr_align();
	                }
	                else {
	                    this._tr_stored_block(0, 0, false);
	                    if (flush === 3) {
	                        for (let i = 0; i < hash_size; i++)
	                            this.head[i] = 0;
	                    }
	                }
	                strm.flush_pending(this);
	                if (strm.avail_out === 0) {
	                    this.last_flush = -1;
	                    return 0;
	                }
	            }
	        }
	        if (flush !== 4)
	            return 0;
	        return 1;
	    }
	}

	class Deflater {
	    constructor(options) {
	        var _a, _b, _c, _d, _e, _f;
	        this.checksum = 1;
	        this.origSize = 0;
	        this.dictChecksum = 0;
	        const level = (_b = (_a = options) === null || _a === void 0 ? void 0 : _a.level, (_b !== null && _b !== void 0 ? _b : 6));
	        const format = (_d = (_c = options) === null || _c === void 0 ? void 0 : _c.format, (_d !== null && _d !== void 0 ? _d : "deflate"));
	        const dictionary = (_e = options) === null || _e === void 0 ? void 0 : _e.dictionary;
	        const fileName = (_f = options) === null || _f === void 0 ? void 0 : _f.fileName;
	        if (typeof level !== "number" || level < 1 || level > 9) {
	            throw new RangeError("level must be between 1 and 9, inclusive");
	        }
	        if (format !== "gzip" && format !== "raw" && format !== "deflate") {
	            throw new RangeError("container must be one of `raw`, `deflate`, `gzip`");
	        }
	        if (typeof fileName !== "undefined" && typeof fileName !== "string") {
	            throw new TypeError("fileName must be a string");
	        }
	        this.fileName = fileName || "";
	        this.z = new ZStream();
	        this.deflate = new Deflate(this.z, level, 0);
	        if (dictionary) {
	            if (format !== "deflate") {
	                throw new TypeError("Can only provide a dictionary for `deflate` containers.");
	            }
	            const dict = u8ArrayFromBufferSource(dictionary);
	            if (!dict) {
	                throw new TypeError("dictionary must be an ArrayBuffer or buffer view");
	            }
	            this.dictChecksum = adler32(dict);
	            this.deflate.deflateSetDictionary(dict);
	        }
	        this.format = format;
	        if (this.format === "gzip") {
	            this.checksum = 0;
	        }
	    }
	    buildZlibHeader() {
	        let headerSize = 2;
	        let check = 1;
	        if (this.dictChecksum !== 0) {
	            headerSize += 4;
	            check = PRESET_DICT;
	        }
	        const buf = new ArrayBuffer(headerSize);
	        const dv = new DataView(buf);
	        dv.setUint16(0, (0x78 << 8) | check);
	        if (this.dictChecksum !== 0) {
	            dv.setUint32(2, this.dictChecksum);
	        }
	        return new Uint8Array(buf);
	    }
	    buildGZipHeader() {
	        let flag = 0;
	        let fileNameBytes = [];
	        if (this.fileName.length > 0) {
	            flag |= 0x08;
	            fileNameBytes = Array.from(this.fileName)
	                .map(c => {
	                const cc = c.charCodeAt(0);
	                return cc > 0xff ? 95 : cc;
	            });
	            fileNameBytes.push(0);
	        }
	        const buf = new ArrayBuffer(10 + fileNameBytes.length);
	        const dv = new DataView(buf);
	        dv.setUint16(0, (GZIP_ID1 << 8) | GZIP_ID2);
	        dv.setUint16(2, (Z_DEFLATED << 8) | flag);
	        const time = Math.floor(Date.now() / 1000);
	        dv.setUint32(4, time, true);
	        dv.setUint16(8, (0 << 8) | 0xff);
	        const ua = new Uint8Array(buf);
	        if (fileNameBytes.length) {
	            ua.set(fileNameBytes, 10);
	        }
	        return ua;
	    }
	    buildTrailer() {
	        const gzip = this.format === "gzip";
	        const size = gzip ? 8 : 4;
	        const trailer = new ArrayBuffer(size);
	        const dv = new DataView(trailer);
	        dv.setUint32(0, this.checksum, gzip);
	        if (gzip) {
	            dv.setUint32(4, this.origSize, true);
	        }
	        return new Uint8Array(trailer);
	    }
	    append(data) {
	        const buffers = [];
	        const chunk = u8ArrayFromBufferSource(data);
	        if (!(chunk instanceof Uint8Array)) {
	            throw new TypeError("data must be an ArrayBuffer or buffer view");
	        }
	        if (!chunk.length) {
	            return buffers;
	        }
	        if (this.format !== "gzip") {
	            this.checksum = adler32(chunk, this.checksum);
	        }
	        else {
	            this.checksum = crc32(chunk, this.checksum);
	        }
	        this.origSize += chunk.length;
	        const { deflate, z } = this;
	        z.next_in_index = 0;
	        z.next_in = chunk;
	        z.avail_in = chunk.length;
	        if (deflate.status === 1) {
	            if (this.format === "deflate") {
	                buffers.push(this.buildZlibHeader());
	            }
	            else if (this.format === "gzip") {
	                buffers.push(this.buildGZipHeader());
	            }
	        }
	        do {
	            z.next_out_index = 0;
	            z.avail_out = OUTPUT_BUFSIZE;
	            const err = deflate.deflate(0);
	            if (err !== 0) {
	                throw new Error("deflating: " + z.msg);
	            }
	            if (z.next_out_index) {
	                buffers.push(new Uint8Array(z.next_out.subarray(0, z.next_out_index)));
	            }
	        } while (z.avail_in > 0 || z.avail_out === 0);
	        return buffers;
	    }
	    finish() {
	        const buffers = [];
	        const { deflate, z } = this;
	        if (deflate.status === 1) {
	            throw new Error("Cannot call finish before at least 1 call to append");
	        }
	        do {
	            z.next_out_index = 0;
	            z.avail_out = OUTPUT_BUFSIZE;
	            const err = deflate.deflate(4);
	            if (err !== 1 && err !== 0) {
	                throw new Error("deflating: " + z.msg);
	            }
	            if (OUTPUT_BUFSIZE - z.avail_out > 0) {
	                buffers.push(new Uint8Array(z.next_out.subarray(0, z.next_out_index)));
	            }
	        } while (z.avail_in > 0 || z.avail_out === 0);
	        if (this.format !== "raw") {
	            buffers.push(this.buildTrailer());
	        }
	        return buffers;
	    }
	}
	function deflate(data, options) {
	    const input = u8ArrayFromBufferSource(data);
	    if (!(input instanceof Uint8Array)) {
	        throw new TypeError("data must be an ArrayBuffer or buffer view");
	    }
	    const deflater = new Deflater(options);
	    const buffers = deflater.append(data);
	    buffers.push(...deflater.finish());
	    return mergeBuffers(buffers);
	}

	exports.Deflater = Deflater;
	exports.Inflater = Inflater;
	exports.adler32 = adler32;
	exports.crc32 = crc32;
	exports.deflate = deflate;
	exports.inflate = inflate;
	exports.mergeBuffers = mergeBuffers;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
