export const mat4 = {
  create: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
  
  ortho: (l, r, b, t, n, f) => {
    const lr = 1 / (l - r);
    const bt = 1 / (b - t);
    const nf = 1 / (n - f);
    const o = mat4.create();
    o[0] = -2 * lr;
    o[5] = -2 * bt;
    o[10] = 2 * nf;
    o[12] = (l + r) * lr;
    o[13] = (t + b) * bt;
    o[14] = (f + n) * nf;
    return o;
  },
  
  translate: (m, v) => {
    const o = [...m];
    o[12] = m[12] + m[0] * v[0] + m[4] * v[1] + m[8] * v[2];
    o[13] = m[13] + m[1] * v[0] + m[5] * v[1] + m[9] * v[2];
    o[14] = m[14] + m[2] * v[0] + m[6] * v[1] + m[10] * v[2];
    return o;
  },
  
  scale: (m, v) => {
    const o = [...m];
    o[0] = m[0] * v[0];
    o[1] = m[1] * v[0];
    o[2] = m[2] * v[0];
    o[4] = m[4] * v[1];
    o[5] = m[5] * v[1];
    o[6] = m[6] * v[1];
    o[8] = m[8] * v[2];
    o[9] = m[9] * v[2];
    o[10] = m[10] * v[2];
    return o;
  },
  
  rotateZ: (m, r) => {
    const s = Math.sin(r);
    const c = Math.cos(r);
    const a00 = m[0], a01 = m[1];
    const a10 = m[4], a11 = m[5];
    const o = [...m];
    o[0] = a00 * c + a10 * s;
    o[1] = a01 * c + a11 * s;
    o[4] = a10 * c - a00 * s;
    o[5] = a11 * c - a01 * s;
    return o;
  }
};
