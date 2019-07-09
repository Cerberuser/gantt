interface SVGUtils {
    (expr: string | Element, con?: Element): Element | null;
    on(element: Element, event: string, selector: string | EventListener, callback: EventListener): void;
    on(element: Element, event: string, callback: EventListener): void;
    off(element: Element, event: string, handler: EventHandlerNonNull): void;
    bind(element: Element, events: string, callback: EventListener): void;
    delegate(element: Element, event: string, selector: string, callback: (e: any, target: any) => void): void;
    closest(selector: string, element: Element): Element | null;
    attr(element: Element, attr: string, value: any): void;
    attr(element: Element, attr: Record<string, any>): void;
    attr(element: Element, attr: string): any;
}
export declare const $: SVGUtils;
export declare function createSVG(tag: string, attrs: Record<string, any> & {
    style?: Record<string, any>;
}): SVGGraphicsElement;
export declare function animateSVG(svgElement: SVGElement, attr: string, from: any, to: any): void;
export {};
