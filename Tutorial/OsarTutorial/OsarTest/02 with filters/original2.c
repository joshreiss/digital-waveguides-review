int filter(float *in, float *out, float *a) {
    float t, y;
    /* a5 = t(n - 1); a6 = t(n - 2) */
    t[n] = x[n] - b[1]*t[n-1] - b[2]*t[n-2]
    y[n] = t[n]*a[0] + a[1]*t[n-1] + a[2]*t[n-2]

    t[n] = in - b1*t[n-1] - b2*t[n-2]
    y[n] = t[n]*a0 + a1*t[n-1] + a2*t[n-2]
    
    y[n] = (x[n]*a0 - b1*t[n-1]*a0 - b2*t[n-2]*a0) + a1*t[n-1] + a2*t[n-2]
    t[n-2] = t[n-1], t[n-1] = t[n] // update
    *out = y;
}
int coef() {
    a[5] = a[6] = 0.0
    let c = 1 / tan(Math.PI * fc / sampleRate) // C constant used in BLT
    /* perform BLT, store components */
        a[0] = 1.0 / (1.0 + c*Math.SQRT2 + c*c)
        a[1] = 2/ (1.0 + c*Math.SQRT2 + c*c)
        a[2] = 1.0 / (1.0 + c*Math.SQRT2 + c*c)
        b[0] = 1
        b[1] = 2.0 * (1.0 - c*c)/ (1.0 + c*Math.SQRT2 + c*c)
        b[2] = (1.0 - c*Math.SQRT2 + c*c)/ (1.0 + c*Math.SQRT2 + c*c)
}
