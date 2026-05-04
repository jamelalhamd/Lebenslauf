declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      allowTaint?: boolean;
      width?: number;
      height?: number;
      scrollX?: number;
      scrollY?: number;
    };
    jsPDF?: { unit?: string; format?: string | number[]; orientation?: string };
    pagebreak?: { mode?: string | string[] };
  }

  interface Html2PdfChain {
    from(element: HTMLElement | string): Html2PdfChain;
    set(options: Html2PdfOptions): Html2PdfChain;
    save(): Promise<void>;
    toPdf(): Html2PdfChain;
    get(type: string): Promise<unknown>;
    output(type?: string, options?: unknown): Html2PdfChain;
  }

  function html2pdf(): Html2PdfChain;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfChain;
  export = html2pdf;
}
