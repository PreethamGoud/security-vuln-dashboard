declare module "oboe" {
  /**
   * Minimal type shim for oboe used inside a Web Worker.
   * We avoid pulling full community types to keep the stack lean.
   */
  const oboe: any;
  export default oboe;
}
