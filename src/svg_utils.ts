// tslint:disable:forin
// tslint:disable:object-literal-sort-keys

interface SVGUtils {
    (expr: string | Element, con?: Element): Element | null;

    on(element: Element, event: string, selector: string | EventListener, callback?: EventListener): void;

    off(element: Element, event: string, handler: EventHandlerNonNull): void;

    bind(element: Element, events: string, callback: EventListener): void;

    delegate(element: Element, event: string, selector: string, callback: (e: any, target: any) => void): void;

    closest(selector: string, element: Element): Element | null;

    attr(element: Element, attr: string, value: any): void;

    attr(element: Element, attr: Record<string, any>): void;

    attr(element: Element, attr: string): any;
}

export const $: SVGUtils = (expr, con?) => {
    return typeof expr === 'string'
        ? (con || document).querySelector(expr)
        : expr || null;
};

export function createSVG(tag: string, attrs: Record<string, any>) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag) as SVGGraphicsElement;
    for (const attr in attrs) {
        if (attr === 'append_to') {
            const parent = attrs.append_to;
            parent.appendChild(elem);
        } else if (attr === 'innerHTML') {
            elem.innerHTML = attrs.innerHTML;
        } else {
            elem.setAttribute(attr, attrs[attr]);
        }
    }
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

function getAnimationElement(
    svgElement: SVGElement,
    attr: string,
    from: any,
    to: any,
    dur = '0.4s',
    begin = '0.1s'
) {
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
        'ease': '.25 .1 .25 1',
        'linear': '0 0 1 1',
        'ease-in': '.42 0 1 1',
        'ease-out': '0 0 .58 1',
        'ease-in-out': '.42 0 .58 1'
    }[name];
}

$.on = (element: Element, event: string, selector: string | EventListener, callback?: EventListener) => {
    if (!callback) {
        callback = selector as EventListener;
        $.bind(element, event, callback);
    } else {
        $.delegate(element, event, selector as string, callback);
    }
};

$.off = (element: Element, event: string, handler: EventHandlerNonNull) => {
    element.removeEventListener(event, handler);
};

$.bind = (element: Element, events: string, callback: EventListener) => {
    events.split(/\s+/).forEach((event) => {
        element.addEventListener(event, callback);
    });
};

$.delegate = (
    element: Element,
    event: string,
    selector: string,
    callback: (e: any, target: any) => void
) => {
    element.addEventListener(event, function(this: Element, e: any) {
        const delegatedTarget = e.target.closest(selector);
        if (delegatedTarget) {
            e.delegatedTarget = delegatedTarget;
            callback.call(this, e, delegatedTarget);
        }
    });
};

$.closest = (selector: string, element: Element): Element | null => {
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
