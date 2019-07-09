import { ITaskInternal } from './index';
export interface IPopupOptions {
    target_element: SVGGraphicsElement;
    position: string;
    task: ITaskInternal;
    title: string;
    subtitle: string;
}
export default class Popup {
    private parent;
    private custom_html;
    private title;
    private subtitle;
    private pointer;
    constructor(parent: Element & ElementCSSInlineStyle, custom_html: (task: ITaskInternal) => string);
    show(options: Partial<IPopupOptions>): void;
    hide(): void;
    private make;
}
