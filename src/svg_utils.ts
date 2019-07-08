// tslint:disable:forin
// tslint:disable:object-literal-sort-keys

declare global {
    // tslint:disable-next-line:interface-name
    interface SVGElement {
        getX(): number;

        getY(): number;

        getWidth(): number;

        getHeight(): number;

        getEndX(): number;
    }
}
(() => {
    (SVGElement as any).prototype.getX = function() {
        return +this.getAttribute('x');
    };
    (SVGElement as any).prototype.getY = function() {
        return +this.getAttribute('y');
    };
    (SVGElement as any).prototype.getWidth = function() {
        return +this.getAttribute('width');
    };
    (SVGElement as any).prototype.getHeight = function() {
        return +this.getAttribute('height');
    };
    (SVGElement as any).prototype.getEndX = function() {
        return this.getX() + this.getWidth();
    };
})();

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

export const $: SVGUtils = (expr, con?) => {
    return typeof expr === 'string' ? (con || document).querySelector(expr) : expr || null;
};

export function createSVG(tag: string, attrs: Record<string, any> & { style?: Record<string, any> }) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag) as SVGGraphicsElement;
    Object.keys(attrs).forEach(attr => {
        if (attr === 'append_to') {
            const parent = attrs.append_to;
            parent.appendChild(elem);
        } else if (attr === 'children') {
            elem.append(attrs[attr]);
        } else if (attr === 'innerHTML') {
            elem.innerHTML = attrs.innerHTML;
        } else if (attr === 'style') {
            Object.keys(attrs.style!).forEach(prop => {
                elem.style.setProperty(prop, attrs.style![prop]);
            });
        } else {
            elem.setAttribute(attr, attrs[attr]);
        }
    });
    return elem;
}

export function animateSVG(svgElement: SVGElement, attr: string, from: any, to: any) {
    const animatedSvgElement = getAnimationElement(svgElement, attr, from, to);

    if (animatedSvgElement === svgElement) {
        // triggered 2nd time programmatically
        // trigger artificial click event
        const event: Event & { eventName: string } = document.createEvent('HTMLEvents') as any;
        event.initEvent('click', true, true);
        event.eventName = 'click';
        animatedSvgElement.dispatchEvent(event);
    }
}

function getAnimationElement(svgElement: SVGElement, attr: string, from: any, to: any, dur = '0.4s', begin = '0.1s') {
    const animEl = svgElement.querySelector('animate');
    if (animEl) {
        $.attr(animEl, {
            attributeName: attr,
            from,
            to,
            dur,
            begin: 'click + ' + begin // artificial click
        });
        return svgElement;
    }

    const animateElement = createSVG('animate', {
        attributeName: attr,
        from,
        to,
        dur,
        begin,
        calcMode: 'spline',
        values: from + ';' + to,
        keyTimes: '0; 1',
        keySplines: cubic_bezier('ease-out')
    });
    svgElement.appendChild(animateElement);

    return svgElement;
}

function cubic_bezier(name: 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out') {
    return {
        ease: '.25 .1 .25 1',
        linear: '0 0 1 1',
        'ease-in': '.42 0 1 1',
        'ease-out': '0 0 .58 1',
        'ease-in-out': '.42 0 .58 1'
    }[name];
}

$.on = (element: Element, event: string, selector: any, callback?: any) => {
    if (!callback) {
        callback = selector as EventListener;
        $.bind(element, event, callback);
    } else {
        $.delegate(element, event, selector as string, callback);
    }
};

$.off = (element, event, handler) => {
    element.removeEventListener(event, handler);
};

$.bind = (element, events, callback) => {
    events.split(/\s+/).forEach(event => {
        element.addEventListener(event, callback);
    });
};

$.delegate = (element, event, selector, callback) => {
    element.addEventListener(event, function(this: Element, e: any) {
        const delegatedTarget = e.target.closest(selector);
        if (delegatedTarget) {
            e.delegatedTarget = delegatedTarget;
            callback.call(this, e, delegatedTarget);
        }
    });
};

$.closest = (selector, element) => {
    if (!element) {
        return null;
    }

    if (element.matches(selector)) {
        return element;
    }

    return $.closest(selector, element.parentNode as Element);
};

$.attr = (element: Element, attr: any, value?: any) => {
    if (!value && typeof attr === 'string') {
        return element.getAttribute(attr);
    }

    if (typeof attr === 'object') {
        for (const key in attr) {
            $.attr(element, key, attr[key]);
        }
        return;
    }

    element.setAttribute(attr, value);
    return;
};
