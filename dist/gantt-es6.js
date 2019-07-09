/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

// tslint:disable:forin
// tslint:disable:object-literal-sort-keys
var $ = function (expr, con) {
    return typeof expr === 'string' ? (con || document).querySelector(expr) : expr || null;
};
function createSVG(tag, attrs) {
    var elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs).forEach(function (attr) {
        if (attr === 'append_to') {
            var parent_1 = attrs.append_to;
            parent_1.appendChild(elem);
        }
        else if (attr === 'children') {
            elem.append(attrs[attr]);
        }
        else if (attr === 'innerHTML') {
            elem.innerHTML = attrs.innerHTML;
        }
        else if (attr === 'style') {
            Object.keys(attrs.style).forEach(function (prop) {
                elem.style.setProperty(prop, attrs.style[prop]);
            });
        }
        else {
            elem.setAttribute(attr, attrs[attr]);
        }
    });
    return elem;
}
function animateSVG(svgElement, attr, from, to) {
    var animatedSvgElement = getAnimationElement(svgElement, attr, from, to);
    if (animatedSvgElement === svgElement) {
        // triggered 2nd time programmatically
        // trigger artificial click event
        var event_1 = document.createEvent('HTMLEvents');
        event_1.initEvent('click', true, true);
        event_1.eventName = 'click';
        animatedSvgElement.dispatchEvent(event_1);
    }
}
function getAnimationElement(svgElement, attr, from, to, dur, begin) {
    if (dur === void 0) { dur = '0.4s'; }
    if (begin === void 0) { begin = '0.1s'; }
    var animEl = svgElement.querySelector('animate');
    if (animEl) {
        $.attr(animEl, {
            attributeName: attr,
            from: from,
            to: to,
            dur: dur,
            begin: 'click + ' + begin // artificial click
        });
        return svgElement;
    }
    var animateElement = createSVG('animate', {
        attributeName: attr,
        from: from,
        to: to,
        dur: dur,
        begin: begin,
        calcMode: 'spline',
        values: from + ';' + to,
        keyTimes: '0; 1',
        keySplines: cubic_bezier('ease-out')
    });
    svgElement.appendChild(animateElement);
    return svgElement;
}
function cubic_bezier(name) {
    return {
        ease: '.25 .1 .25 1',
        linear: '0 0 1 1',
        'ease-in': '.42 0 1 1',
        'ease-out': '0 0 .58 1',
        'ease-in-out': '.42 0 .58 1'
    }[name];
}
$.on = function (element, event, selector, callback) {
    if (!callback) {
        callback = selector;
        $.bind(element, event, callback);
    }
    else {
        $.delegate(element, event, selector, callback);
    }
};
$.off = function (element, event, handler) {
    element.removeEventListener(event, handler);
};
$.bind = function (element, events, callback) {
    events.split(/\s+/).forEach(function (event) {
        element.addEventListener(event, callback);
    });
};
$.delegate = function (element, event, selector, callback) {
    element.addEventListener(event, function (e) {
        var delegatedTarget = e.target.closest(selector);
        if (delegatedTarget) {
            e.delegatedTarget = delegatedTarget;
            callback.call(this, e, delegatedTarget);
        }
    });
};
$.closest = function (selector, element) {
    if (!element) {
        return null;
    }
    if (element.matches(selector)) {
        return element;
    }
    return $.closest(selector, element.parentNode);
};
$.attr = function (element, attr, value) {
    if (!value && typeof attr === 'string') {
        return element.getAttribute(attr);
    }
    if (typeof attr === 'object') {
        for (var key in attr) {
            $.attr(element, key, attr[key]);
        }
        return;
    }
    element.setAttribute(attr, value);
    return;
};

// tslint:disable:variable-name
var Arrow = /** @class */ (function () {
    function Arrow(gantt, from_task, to_task) {
        this.element = null;
        this.path = null;
        this.gantt = gantt;
        this.from_task = from_task;
        this.to_task = to_task;
        this.calculate_path();
        this.draw();
    }
    Arrow.prototype.update = function () {
        this.calculate_path();
        this.element.setAttribute('d', this.path);
    };
    Arrow.prototype.calculate_path = function () {
        var _this = this;
        var start_x = this.from_task.$bar.getX() + this.from_task.$bar.getWidth() / 2;
        var condition = function () {
            return _this.to_task.$bar.getX() < start_x + _this.gantt.options.padding &&
                start_x > _this.from_task.$bar.getX() + _this.gantt.options.padding;
        };
        while (condition()) {
            start_x -= 10;
        }
        var start_y = this.gantt.options.header_height +
            this.gantt.options.bar_height +
            (this.gantt.options.padding + this.gantt.options.bar_height) * this.from_task.task._index +
            this.gantt.options.padding;
        var end_x = this.to_task.$bar.getX() - this.gantt.options.padding / 2;
        var end_y = this.gantt.options.header_height +
            this.gantt.options.bar_height / 2 +
            (this.gantt.options.padding + this.gantt.options.bar_height) * this.to_task.task._index +
            this.gantt.options.padding;
        var from_is_below_to = this.from_task.task._index > this.to_task.task._index;
        var curve = this.gantt.options.arrow_curve;
        var clockwise = from_is_below_to ? 1 : 0;
        var curve_y = from_is_below_to ? -curve : curve;
        var offset = from_is_below_to
            ? end_y + this.gantt.options.arrow_curve
            : end_y - this.gantt.options.arrow_curve;
        this.path = "\n            M " + start_x + " " + start_y + "\n            V " + offset + "\n            a " + curve + " " + curve + " 0 0 " + clockwise + " " + curve + " " + curve_y + "\n            L " + end_x + " " + end_y + "\n            m -5 -5\n            l 5 5\n            l -5 5";
        if (this.to_task.$bar.getX() < this.from_task.$bar.getX() + this.gantt.options.padding) {
            var down_1 = this.gantt.options.padding / 2 - curve;
            var down_2 = this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2 - curve_y;
            var left = this.to_task.$bar.getX() - this.gantt.options.padding;
            this.path = "\n                M " + start_x + " " + start_y + "\n                v " + down_1 + "\n                a " + curve + " " + curve + " 0 0 1 -" + curve + " " + curve + "\n                H " + left + "\n                a " + curve + " " + curve + " 0 0 " + clockwise + " -" + curve + " " + curve_y + "\n                V " + down_2 + "\n                a " + curve + " " + curve + " 0 0 " + clockwise + " " + curve + " " + curve_y + "\n                L " + end_x + " " + end_y + "\n                m -5 -5\n                l 5 5\n                l -5 5";
        }
    };
    Arrow.prototype.draw = function () {
        this.element = createSVG('path', {
            className: 'arrow',
            d: this.path,
            'data-from': this.from_task.task.id,
            'data-to': this.to_task.task.id
        });
    };
    return Arrow;
}());

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var dist = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var UnreachableError = /** @class */ (function (_super) {
    __extends(UnreachableError, _super);
    function UnreachableError(message) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, _newTarget.prototype);
        return _this;
    }
    return UnreachableError;
}(Error));
exports.UnreachableError = UnreachableError;
function unreachable(checkedValue, message) {
    throw (message
        ? new UnreachableError(message)
        : new TypeError("Unexpected value: " + JSON.stringify(checkedValue)));
}
exports.unreachable = unreachable;
});

unwrapExports(dist);
var dist_1 = dist.UnreachableError;
var dist_2 = dist.unreachable;

// tslint:disable:variable-name
var YEAR = 'year';
var MONTH = 'month';
var DAY = 'day';
var HOUR = 'hour';
var MINUTE = 'minute';
var SECOND = 'second';
var MILLISECOND = 'millisecond';
var month_names = {
    en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],
    ru: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь'
    ],
    ptBr: [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ]
};
var date_utils = /** @class */ (function () {
    function date_utils() {
    }
    date_utils.prototype.parse = function (date, date_separator, time_separator) {
        if (date_separator === void 0) { date_separator = '-'; }
        if (time_separator === void 0) { time_separator = /[.:]/; }
        if (date instanceof Date) {
            return date;
        }
        if (typeof date === 'string') {
            var date_parts = void 0;
            var time_parts = void 0;
            var parts = date.split(' ');
            date_parts = parts[0].split(date_separator).map(function (val) { return parseInt(val, 10); });
            time_parts = parts[1] ? parts[1].split(time_separator) : null;
            // month is 0 indexed
            date_parts[1] = date_parts[1] - 1;
            var vals = date_parts;
            if (time_parts && time_parts.length) {
                if (time_parts.length === 4) {
                    time_parts[3] = '0.' + time_parts[3];
                    time_parts[3] = parseFloat(time_parts[3]) * 1000;
                }
                vals = vals.concat(time_parts);
            }
            return new (Date.bind.apply(Date, [void 0].concat(vals)))();
        }
        return dist_2(date, 'Parse function received an unexpected object');
    };
    date_utils.prototype.to_string = function (date, with_time) {
        if (with_time === void 0) { with_time = false; }
        if (!(date instanceof Date)) {
            throw new TypeError('Invalid argument type');
        }
        var vals = this.get_date_values(date).map(function (val, i) {
            if (i === 1) {
                // add 1 for month
                val = val + 1;
            }
            if (i === 6) {
                return padStart(val + '', 3, '0');
            }
            return padStart(val + '', 2, '0');
        });
        var date_string = vals[0] + "-" + vals[1] + "-" + vals[2];
        var time_string = vals[3] + ":" + vals[4] + ":" + vals[5] + "." + vals[6];
        return date_string + (with_time ? ' ' + time_string : '');
    };
    date_utils.prototype.format = function (date, format_string, lang) {
        if (format_string === void 0) { format_string = 'YYYY-MM-DD HH:mm:ss.SSS'; }
        if (lang === void 0) { lang = 'en'; }
        var values = this.get_date_values(date).map(function (d) { return padStart(d, 2, 0); });
        var format_map = {
            YYYY: values[0],
            MM: padStart(+values[1] + 1, 2, 0),
            DD: values[2],
            HH: values[3],
            mm: values[4],
            ss: values[5],
            SSS: values[6],
            D: values[2],
            MMMM: month_names[lang][+values[1]],
            MMM: month_names[lang][+values[1]]
        };
        var str = format_string;
        var formatted_values = [];
        Object.keys(format_map)
            .sort(function (a, b) { return b.length - a.length; }) // big string first
            .forEach(function (key) {
            if (str.includes(key)) {
                str = str.replace(key, "$" + formatted_values.length);
                formatted_values.push(format_map[key]);
            }
        });
        formatted_values.forEach(function (value, i) {
            str = str.replace("$" + i, value);
        });
        return str;
    };
    date_utils.prototype.diff = function (date_a, date_b, scale) {
        if (scale === void 0) { scale = DAY; }
        var milliseconds;
        var seconds;
        var hours;
        var minutes;
        var days;
        var months;
        var years;
        milliseconds = date_a - date_b;
        seconds = milliseconds / 1000;
        minutes = seconds / 60;
        hours = minutes / 60;
        days = hours / 24;
        months = days / 30;
        years = months / 12;
        if (!scale.endsWith('s')) {
            scale += 's';
        }
        return Math.floor({
            milliseconds: milliseconds,
            seconds: seconds,
            minutes: minutes,
            hours: hours,
            days: days,
            months: months,
            years: years
        }[scale]);
    };
    date_utils.prototype.today = function () {
        var vals = this.get_date_values(new Date()).slice(0, 3);
        return new (Date.bind.apply(Date, [void 0].concat(vals)))();
    };
    date_utils.prototype.now = function () {
        return new Date();
    };
    date_utils.prototype.add = function (date, qty, scale) {
        qty = parseInt(qty, 10);
        var vals = [
            date.getFullYear() + (scale === YEAR ? qty : 0),
            date.getMonth() + (scale === MONTH ? qty : 0),
            date.getDate() + (scale === DAY ? qty : 0),
            date.getHours() + (scale === HOUR ? qty : 0),
            date.getMinutes() + (scale === MINUTE ? qty : 0),
            date.getSeconds() + (scale === SECOND ? qty : 0),
            date.getMilliseconds() + (scale === MILLISECOND ? qty : 0)
        ];
        return new (Date.bind.apply(Date, [void 0].concat(vals)))();
    };
    date_utils.prototype.start_of = function (date, scale) {
        var _a;
        var scores = (_a = {},
            _a[YEAR] = 6,
            _a[MONTH] = 5,
            _a[DAY] = 4,
            _a[HOUR] = 3,
            _a[MINUTE] = 2,
            _a[SECOND] = 1,
            _a[MILLISECOND] = 0,
            _a);
        function should_reset(_scale) {
            var max_score = scores[scale];
            return scores[_scale] <= max_score;
        }
        var vals = [
            date.getFullYear(),
            should_reset(YEAR) ? 0 : date.getMonth(),
            should_reset(MONTH) ? 1 : date.getDate(),
            should_reset(DAY) ? 0 : date.getHours(),
            should_reset(HOUR) ? 0 : date.getMinutes(),
            should_reset(MINUTE) ? 0 : date.getSeconds(),
            should_reset(SECOND) ? 0 : date.getMilliseconds()
        ];
        return new (Date.bind.apply(Date, [void 0].concat(vals)))();
    };
    date_utils.prototype.clone = function (date) {
        return new (Date.bind.apply(Date, [void 0].concat(this.get_date_values(date))))();
    };
    date_utils.prototype.get_date_values = function (date) {
        return [
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
        ];
    };
    date_utils.prototype.get_days_in_month = function (date) {
        var no_of_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var month = date.getMonth();
        if (month !== 1) {
            return no_of_days[month];
        }
        // Feb
        var year = date.getFullYear();
        if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
            return 29;
        }
        return 28;
    };
    return date_utils;
}());
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
function padStart(str, targetLength, padString) {
    str = str + '';
    // tslint:disable:no-bitwise
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (str.length > targetLength) {
        return String(str);
    }
    else {
        targetLength = targetLength - str.length;
        if (targetLength > padString.length) {
            padString += padString.repeat(targetLength / padString.length);
        }
        return padString.slice(0, targetLength) + String(str);
    }
}
var utils = new date_utils();

// tslint:disable:variable-name
var Bar = /** @class */ (function () {
    function Bar(gantt, task) {
        this.group = null;
        this.$bar = null;
        this.task = null;
        this.arrows = null;
        this.$bar_progress = null;
        this.$handle_progress = null;
        this.action_completed = null;
        this.gantt = null;
        this.invalid = null;
        this.height = null;
        this.x = null;
        this.y = null;
        this.corner_radius = null;
        this.duration = null;
        this.width = null;
        this.progress_width = null;
        this.bar_group = null;
        this.handle_group = null;
        this.set_defaults(gantt, task);
        this.prepare();
        this.draw();
        this.bind();
    }
    Bar.prepare_helpers = function () {
        SVGElement.prototype.getX = function () {
            return +this.getAttribute('x');
        };
        SVGElement.prototype.getY = function () {
            return +this.getAttribute('y');
        };
        SVGElement.prototype.getWidth = function () {
            return +this.getAttribute('width');
        };
        SVGElement.prototype.getHeight = function () {
            return +this.getAttribute('height');
        };
        SVGElement.prototype.getEndX = function () {
            return this.getX() + this.getWidth();
        };
    };
    Bar.prototype.update_bar_position = function (_a) {
        var _this = this;
        var x = _a.x, width = _a.width;
        if (x) {
            // get all x values of parent task
            var xs = this.task.dependencies.map(function (dep) {
                return _this.gantt.get_bar(dep).$bar.getX();
            });
            // child task must not go before parent
            var valid_x = xs.reduce((function (_, curr) {
                return x >= curr;
            }), x); // why it ever works?!
            if (!valid_x) {
                width = undefined;
                return;
            }
            this.update_attr('x', x);
        }
        if (width && width >= this.gantt.options.column_width) {
            this.update_attr('width', width);
        }
        this.update_label_position();
        this.update_handle_position();
        this.update_progressbar_position();
        this.update_arrow_position();
    };
    Bar.prototype.get_progress_polygon_points = function () {
        var bar_progress = this.$bar_progress;
        return [
            bar_progress.getEndX() - 5,
            bar_progress.getY() + bar_progress.getHeight(),
            bar_progress.getEndX() + 5,
            bar_progress.getY() + bar_progress.getHeight(),
            bar_progress.getEndX(),
            bar_progress.getY() + bar_progress.getHeight() - 8.66
        ];
    };
    Bar.prototype.date_changed = function () {
        var changed = false;
        var _a = this.compute_start_end_date(), new_start_date = _a.new_start_date, new_end_date = _a.new_end_date;
        if (Number(this.task._start) !== Number(new_start_date)) {
            changed = true;
            this.task._start = new_start_date;
        }
        if (Number(this.task._end) !== Number(new_end_date)) {
            changed = true;
            this.task._end = new_end_date;
        }
        if (!changed) {
            return;
        }
        this.gantt.trigger_event('date_change', [
            this.task,
            new_start_date,
            utils.add(new_end_date, -1, 'second')
        ]);
    };
    Bar.prototype.progress_changed = function () {
        var new_progress = this.compute_progress();
        this.task.progress = new_progress;
        this.gantt.trigger_event('progress_change', [this.task, new_progress]);
    };
    Bar.prototype.set_action_completed = function () {
        var _this = this;
        this.action_completed = true;
        setTimeout(function () { return (_this.action_completed = false); }, 1000);
    };
    Bar.prototype.set_defaults = function (gantt, task) {
        this.action_completed = false;
        this.gantt = gantt;
        this.task = task;
    };
    Bar.prototype.prepare = function () {
        this.prepare_values();
        Bar.prepare_helpers();
    };
    Bar.prototype.prepare_values = function () {
        this.invalid = this.task.invalid;
        this.height = this.gantt.options.bar_height;
        this.x = this.compute_x();
        this.y = this.compute_y();
        this.corner_radius = this.gantt.options.bar_corner_radius;
        this.duration = utils.diff(this.task._end, this.task._start, 'hour') / this.gantt.options.step;
        this.width = this.gantt.options.column_width * this.duration;
        this.progress_width = this.gantt.options.column_width * this.duration * (this.task.progress / 100) || 0;
        this.group = createSVG('g', {
            class: 'bar-wrapper ' + (this.task.custom_class || ''),
            'data-id': this.task.id
        });
        this.bar_group = createSVG('g', {
            class: 'bar-group',
            append_to: this.group
        });
        this.handle_group = createSVG('g', {
            class: 'handle-group',
            append_to: this.group
        });
    };
    Bar.prototype.draw = function () {
        this.draw_bar();
        this.draw_progress_bar();
        this.draw_label();
        this.draw_resize_handles();
    };
    Bar.prototype.draw_bar = function () {
        this.$bar = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'bar',
            append_to: this.bar_group,
            style: { fill: this.task.color }
        });
        animateSVG(this.$bar, 'width', 0, this.width);
        if (this.invalid) {
            this.$bar.classList.add('bar-invalid');
        }
    };
    Bar.prototype.draw_progress_bar = function () {
        if (this.invalid) {
            return;
        }
        this.$bar_progress = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.progress_width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'bar-progress',
            append_to: this.bar_group,
            style: { fill: this.task.color }
        });
        animateSVG(this.$bar_progress, 'width', 0, this.progress_width);
    };
    Bar.prototype.draw_label = function () {
        var _this = this;
        createSVG('text', {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            innerHTML: this.task.name,
            class: 'bar-label',
            append_to: this.bar_group
        });
        // labels get BBox in the next tick
        requestAnimationFrame(function () { return _this.update_label_position(); });
    };
    Bar.prototype.draw_resize_handles = function () {
        if (this.invalid) {
            return;
        }
        var bar = this.$bar;
        var handle_width = 8;
        createSVG('rect', {
            x: bar.getX() + bar.getWidth() - 9,
            y: bar.getY() + 1,
            width: handle_width,
            height: this.height - 2,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'handle right',
            append_to: this.handle_group
        });
        createSVG('rect', {
            x: bar.getX() + 1,
            y: bar.getY() + 1,
            width: handle_width,
            height: this.height - 2,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'handle left',
            append_to: this.handle_group
        });
        if (this.task.progress && this.task.progress < 100) {
            this.$handle_progress = createSVG('polygon', {
                points: this.get_progress_polygon_points().join(','),
                class: 'handle progress',
                append_to: this.handle_group
            });
        }
    };
    Bar.prototype.bind = function () {
        if (this.invalid) {
            return;
        }
        this.setup_click_event();
        this.setup_hover_event();
    };
    Bar.prototype.setup_click_event = function () {
        var _this = this;
        if (this.gantt.options.click_trigger) {
            $.on(this.group, 'focus ' + this.gantt.options.popup_trigger, function (e) {
                if (_this.action_completed) {
                    // just finished a move action, wait for a few seconds
                    return;
                }
                if (e.type === 'click') {
                    _this.gantt.trigger_event('click', [_this.task]);
                }
                _this.gantt.unselect_all();
                _this.group.classList.toggle('active');
                _this.show_popup();
            });
        }
    };
    Bar.prototype.setup_hover_event = function () {
        var _this = this;
        $.on(this.group, 'mouseover ' + this.gantt.options.popup_trigger, function () {
            _this.show_popup();
        });
        $.on(this.group, 'mouseout ' + this.gantt.options.popup_trigger, function () {
            _this.gantt.hide_popup();
        });
    };
    Bar.prototype.show_popup = function () {
        if (this.gantt.bar_being_dragged) {
            return;
        }
        var start_date = utils.format(this.task._start, 'MMM D');
        var end_date = utils.format(utils.add(this.task._end, -1, 'second'), 'MMM D');
        var subtitle = start_date + ' - ' + end_date + (this.task.custom_data ? '<br>' + this.task.custom_data : '');
        this.gantt.show_popup({
            target_element: this.$bar,
            title: this.task.name,
            subtitle: subtitle,
            position: 'middle',
            task: this.task
        });
    };
    Bar.prototype.compute_start_end_date = function () {
        var bar = this.$bar;
        var x_in_units = bar.getX() / this.gantt.options.column_width;
        var new_start_date = utils.add(this.gantt.gantt_start, x_in_units * this.gantt.options.step, 'hour');
        var width_in_units = bar.getWidth() / this.gantt.options.column_width;
        var new_end_date = utils.add(new_start_date, width_in_units * this.gantt.options.step, 'hour');
        return { new_start_date: new_start_date, new_end_date: new_end_date };
    };
    Bar.prototype.compute_progress = function () {
        var progress = (this.$bar_progress.getWidth() / this.$bar.getWidth()) * 100;
        return parseInt(progress, 10);
    };
    Bar.prototype.compute_x = function () {
        var _a = this.gantt.options, step = _a.step, column_width = _a.column_width;
        var task_start = this.task._start;
        var gantt_start = this.gantt.gantt_start;
        var diffHour = utils.diff(task_start, gantt_start, 'hour');
        var x = (diffHour / step) * column_width;
        if (this.gantt.view_is('Month')) {
            var diffDay = utils.diff(task_start, gantt_start, 'day');
            x = (diffDay * column_width) / 30;
        }
        return x + 150; // TODO: this looks like a hack
    };
    Bar.prototype.compute_y = function () {
        return (this.gantt.options.header_height +
            this.gantt.options.padding +
            this.task._index * (this.height + this.gantt.options.padding));
    };
    Bar.prototype.update_attr = function (attr, value) {
        value = +value;
        if (!isNaN(value)) {
            this.$bar.setAttribute(attr, value);
        }
        return this.$bar;
    };
    Bar.prototype.update_progressbar_position = function () {
        this.$bar_progress.setAttribute('x', this.$bar.getX());
        this.$bar_progress.setAttribute('width', (this.$bar.getWidth() * (this.task.progress / 100)));
    };
    Bar.prototype.update_label_position = function () {
        var bar = this.$bar;
        var label = this.group.querySelector('.bar-label');
        if (label.getBBox().width > bar.getWidth()) {
            label.classList.add('big');
            // TODO: is this ever optimal?
            var s = label.innerHTML;
            while (s.length > 0 && label.getBBox().width > bar.getWidth()) {
                s = s.slice(0, -1);
            }
            label.innerHTML = s + '...';
        }
        else {
            label.classList.remove('big');
            label.setAttribute('x', (bar.getX() + bar.getWidth() / 2));
        }
    };
    Bar.prototype.update_handle_position = function () {
        var bar = this.$bar;
        this.handle_group.querySelector('.handle.left').setAttribute('x', (bar.getX() + 1));
        this.handle_group.querySelector('.handle.right').setAttribute('x', (bar.getEndX() - 9));
        var handle = this.group.querySelector('.handle.progress');
        if (handle) {
            handle.setAttribute('points', this.get_progress_polygon_points());
        }
    };
    Bar.prototype.update_arrow_position = function () {
        this.arrows = this.arrows || [];
        for (var _i = 0, _a = this.arrows; _i < _a.length; _i++) {
            var arrow = _a[_i];
            arrow.update();
        }
    };
    return Bar;
}());

// tslint:disable:variable-name
// tslint:disable:object-literal-sort-keys
var Popup = /** @class */ (function () {
    function Popup(parent, custom_html) {
        this.parent = null;
        this.custom_html = null;
        this.title = null;
        this.subtitle = null;
        this.pointer = null;
        this.parent = parent;
        this.custom_html = custom_html;
        this.make();
    }
    Popup.prototype.show = function (options) {
        if (!options.target_element) {
            throw new Error('target_element is required to show popup');
        }
        if (!options.position) {
            options.position = 'left';
        }
        var target_element = options.target_element;
        if (this.custom_html) {
            var html = this.custom_html(options.task);
            html += '<div class="pointer"></div>';
            this.parent.innerHTML = html;
            this.pointer = this.parent.querySelector('.pointer');
        }
        else {
            // set data
            this.title.innerHTML = options.title;
            this.subtitle.innerHTML = options.subtitle;
            this.parent.style.width = this.parent.clientWidth + 'px';
        }
        // set position
        var position_meta = null;
        if (target_element instanceof HTMLElement) {
            position_meta = target_element.getBoundingClientRect();
        }
        else if (target_element instanceof SVGElement) {
            position_meta = options.target_element.getBBox();
        }
        // FIXME this has to be refactored
        if (options.position === 'left') {
            var parentHeight = this.parent.clientHeight + 10;
            this.parent.style.left = position_meta.x + 'px';
            if (position_meta.y < parentHeight) {
                this.parent.style.top = position_meta.y + 50 + 'px';
            }
            else {
                this.parent.style.top = position_meta.y - parentHeight + 'px';
            }
            this.pointer.style.transform = 'rotateZ(90deg)';
            this.pointer.style.left = '-7px';
            this.pointer.style.top = '2px';
        }
        else if (options.position === 'middle') {
            var parentHeight = this.parent.clientHeight + 10;
            this.parent.style.left = position_meta.x + position_meta.width / 2 - this.parent.clientWidth / 2 + 'px';
            if (position_meta.y < parentHeight) {
                this.parent.style.top = position_meta.y + 50 + 'px';
            }
            else {
                this.parent.style.top = position_meta.y - parentHeight + 'px';
            }
        }
        // FIXME ends here
        // show
        this.parent.style.opacity = 1;
    };
    Popup.prototype.hide = function () {
        this.parent.style.opacity = 0;
    };
    Popup.prototype.make = function () {
        this.parent.innerHTML = "\n            <div class=\"title\"></div>\n            <div class=\"subtitle\"></div>\n            <div class=\"pointer\"></div>\n        ";
        this.hide();
        this.title = this.parent.querySelector('.title');
        this.subtitle = this.parent.querySelector('.subtitle');
        this.pointer = this.parent.querySelector('.pointer');
    };
    return Popup;
}());

(function () {
    SVGElement.prototype.getX = function () {
        return +this.getAttribute('x');
    };
    SVGElement.prototype.getY = function () {
        return +this.getAttribute('y');
    };
    SVGElement.prototype.getWidth = function () {
        return +this.getAttribute('width');
    };
    SVGElement.prototype.getHeight = function () {
        return +this.getAttribute('height');
    };
    SVGElement.prototype.getEndX = function () {
        return this.getX() + this.getWidth();
    };
})();

// tslint:disable:variable-name
var colors = [
    '#60bbe4',
    '#b7d95f',
    '#f9c26b',
    '#8ed4fd',
    '#d898ca',
    '#f1d154',
    '#94b9c5',
    '#ccc5a9',
    '#57bbcb',
    '#dbda52',
    '#99abf9'
];
var getColor = function (index) { return colors[index % colors.length]; };
var Gantt = /** @class */ (function () {
    function Gantt(wrapper, tasks, options) {
        this.options = null;
        this.bar_being_dragged = null;
        this.gantt_start = null;
        this.$svg = null;
        this.$container = null;
        this.popup_wrapper = null;
        this.tasks = null;
        this.dependency_map = null;
        this.gantt_end = null;
        this.dates = null;
        this.layers = null;
        this.bars = null;
        this.arrows = null;
        this.popup = null;
        this.groups = null;
        this.setup_wrapper(wrapper);
        this.setup_options(options);
        this.setup_tasks(tasks);
        // initialize with default view mode
        this.change_view_mode();
        this.bind_events();
    }
    Gantt.prototype.unselect_all = function () {
        Array.from(this.$svg.querySelectorAll('.bar-wrapper')).forEach(function (el) {
            el.classList.remove('active');
        });
    };
    Gantt.prototype.view_is = function (modes) {
        var _this = this;
        if (typeof modes === 'string') {
            return this.options.view_mode === modes;
        }
        if (Array.isArray(modes)) {
            return modes.some(function (mode) { return _this.options.view_mode === mode; });
        }
        return false;
    };
    Gantt.prototype.get_bar = function (id) {
        return this.bars.find(function (bar) {
            return bar.task.id === id;
        });
    };
    Gantt.prototype.show_popup = function (options) {
        if (!this.popup) {
            this.popup = new Popup(this.popup_wrapper, this.options.custom_popup_html);
        }
        this.popup.show(options);
    };
    Gantt.prototype.hide_popup = function () {
        if (this.popup) {
            this.popup.hide();
        }
    };
    Gantt.prototype.trigger_event = function (event, args) {
        if (this.options['on_' + event]) {
            this.options['on_' + event].apply(null, args);
        }
    };
    Gantt.prototype.refresh = function (tasks) {
        this.setup_tasks(tasks);
        this.change_view_mode();
    };
    Gantt.prototype.setup_wrapper = function (element) {
        var svg_element;
        var wrapper_element;
        var local_element = element;
        // CSS Selector is passed
        if (typeof element === 'string') {
            local_element = document.querySelector(element);
        }
        // get the SVGElement
        if (local_element instanceof HTMLElement) {
            wrapper_element = local_element;
            svg_element = local_element.querySelector('svg');
        }
        else if (local_element instanceof SVGElement) {
            svg_element = local_element;
        }
        else {
            throw new TypeError('Frappé Gantt only supports usage of a string CSS selector,' +
                " HTML DOM element or SVG DOM element for the 'element' parameter");
        }
        // svg element
        if (!svg_element) {
            // create it
            this.$svg = createSVG('svg', {
                append_to: wrapper_element,
                class: 'gantt'
            });
        }
        else {
            this.$svg = svg_element;
            this.$svg.classList.add('gantt');
        }
        // wrapper element
        this.$container = document.createElement('div');
        this.$container.classList.add('gantt-container');
        var parent_element = this.$svg.parentElement;
        parent_element.appendChild(this.$container);
        this.$container.appendChild(this.$svg);
        // popup wrapper
        this.popup_wrapper = document.createElement('div');
        this.popup_wrapper.classList.add('popup-wrapper');
        this.$container.appendChild(this.popup_wrapper);
    };
    Gantt.prototype.setup_options = function (options) {
        var default_options = {
            auto_scroll: false,
            click_trigger: false,
            interactive: false,
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: [
                "Quarter Day" /* QuarterDay */,
                "Half Day" /* HalfDay */,
                "Day" /* Day */,
                "Week" /* Week */,
                "Month" /* Month */,
                "Year" /* Year */
            ],
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            view_mode: "Day" /* Day */,
            date_format: 'YYYY-MM-DD',
            popup_trigger: 'click',
            custom_popup_html: null,
            language: 'en'
        };
        this.options = Object.assign({}, default_options, options);
    };
    Gantt.prototype.setup_tasks = function (tasks) {
        // prepare tasks
        this.tasks = tasks.map(function (_task, i) {
            var task = _task; // hack to get around typing problems
            // convert to Date objects
            task._start = utils.parse(task.start);
            task._end = utils.parse(task.end);
            // make task invalid if duration too large
            if (utils.diff(task._end, task._start, 'year') > 10) {
                task.end = null; // hack
            }
            // cache index
            task._index = i;
            // invalid dates
            if (!task.start && !task.end) {
                var today = utils.today();
                task._start = today;
                task._end = utils.add(today, 2, 'day');
            }
            if (!task.start && task.end) {
                task._start = utils.add(task._end, -2, 'day');
            }
            if (task.start && !task.end) {
                task._end = utils.add(task._start, 2, 'day');
            }
            // if hours is not set, assume the last day is full day
            // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
            var task_end_values = utils.get_date_values(task._end);
            if (task_end_values.slice(3).every(function (d) { return d === 0; })) {
                task._end = utils.add(task._end, 24, 'hour');
            }
            // invalid flag
            if (!task.start || !task.end) {
                task.invalid = true;
            }
            // dependencies
            if (typeof task.dependencies === 'string' || !task.dependencies) {
                var deps = [];
                if (task.dependencies) {
                    deps = task.dependencies
                        .split(',')
                        .map(function (d) { return d.trim(); })
                        .filter(function (d) { return d; });
                }
                task.dependencies = deps;
            }
            // uids
            if (!task.id) {
                task.id = generate_id(task);
            }
            return task;
        });
        this.setup_dependencies();
        this.setup_groups();
    };
    Gantt.prototype.setup_dependencies = function () {
        this.dependency_map = {};
        for (var _i = 0, _a = this.tasks; _i < _a.length; _i++) {
            var t = _a[_i];
            for (var _b = 0, _c = t.dependencies; _b < _c.length; _b++) {
                var d = _c[_b];
                this.dependency_map[d] = this.dependency_map[d] || [];
                this.dependency_map[d].push(t.id);
            }
        }
    };
    Gantt.prototype.setup_groups = function () {
        var _this = this;
        this.groups = {};
        var groupsCount = 0;
        this.tasks.forEach(function (task) {
            if (!_this.groups[task.group]) {
                groupsCount++;
                _this.groups[task.group] = { color: getColor(groupsCount) };
            }
        });
    };
    Gantt.prototype.change_view_mode = function (mode) {
        if (mode === void 0) { mode = this.options.view_mode; }
        this.update_view_scale(mode);
        if (this.tasks.length === 0) {
            return;
        }
        this.setup_dates();
        this.render();
        // fire viewmode_change event
        this.trigger_event('view_change', [mode]);
    };
    Gantt.prototype.update_view_scale = function (view_mode) {
        this.options.view_mode = view_mode;
        if (view_mode === 'Day') {
            this.options.step = 24;
            this.options.column_width = 38;
        }
        else if (view_mode === 'Half Day') {
            this.options.step = 24 / 2;
            this.options.column_width = 38;
        }
        else if (view_mode === 'Quarter Day') {
            this.options.step = 24 / 4;
            this.options.column_width = 38;
        }
        else if (view_mode === 'Week') {
            this.options.step = 24 * 7;
            this.options.column_width = 140;
        }
        else if (view_mode === 'Month') {
            this.options.step = 24 * 30;
            this.options.column_width = 120;
        }
        else if (view_mode === 'Year') {
            this.options.step = 24 * 365;
            this.options.column_width = 120;
        }
    };
    Gantt.prototype.setup_dates = function () {
        this.setup_gantt_dates();
        this.setup_date_values();
    };
    Gantt.prototype.setup_gantt_dates = function () {
        this.gantt_start = this.gantt_end = null;
        for (var _i = 0, _a = this.tasks; _i < _a.length; _i++) {
            var task = _a[_i];
            // set global start and end date
            if (!this.gantt_start || task._start < this.gantt_start) {
                this.gantt_start = task._start;
            }
            if (!this.gantt_end || task._end > this.gantt_end) {
                this.gantt_end = task._end;
            }
        }
        this.gantt_start = utils.start_of(this.gantt_start, 'day');
        this.gantt_end = utils.start_of(this.gantt_end, 'day');
        // add date padding on both sides
        if (this.view_is(['Quarter Day', 'Half Day'])) {
            this.gantt_start = utils.add(this.gantt_start, -7, 'day');
            this.gantt_end = utils.add(this.gantt_end, 7, 'day');
        }
        else if (this.view_is('Month')) {
            this.gantt_start = utils.start_of(this.gantt_start, 'year');
            this.gantt_end = utils.add(this.gantt_end, 1, 'year');
        }
        else if (this.view_is('Year')) {
            this.gantt_start = utils.add(this.gantt_start, -2, 'year');
            this.gantt_end = utils.add(this.gantt_end, 2, 'year');
        }
        else {
            this.gantt_start = utils.add(this.gantt_start, -1, 'month');
            this.gantt_end = utils.add(this.gantt_end, 1, 'month');
        }
    };
    Gantt.prototype.setup_date_values = function () {
        this.dates = [];
        var cur_date = null;
        while (cur_date === null ||
            cur_date < this.gantt_end ||
            this.dates.length * this.options.column_width + 150 < this.$container.offsetWidth) {
            if (!cur_date) {
                cur_date = utils.clone(this.gantt_start);
            }
            else {
                if (this.view_is('Year')) {
                    cur_date = utils.add(cur_date, 1, 'year');
                }
                else if (this.view_is('Month')) {
                    cur_date = utils.add(cur_date, 1, 'month');
                }
                else {
                    cur_date = utils.add(cur_date, this.options.step, 'hour');
                }
            }
            this.dates.push(cur_date);
        }
    };
    Gantt.prototype.bind_events = function () {
        this.bind_grid_click();
        this.bind_bar_events();
    };
    Gantt.prototype.render = function () {
        this.clear();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_bars();
        this.make_arrows();
        this.map_arrows_on_bars();
        this.set_width();
        this.set_scroll_position();
    };
    Gantt.prototype.setup_layers = function () {
        this.layers = {};
        var layers = ['grid', 'date', 'arrow', 'progress', 'bar', 'details'];
        // make group layers
        for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
            var layer = layers_1[_i];
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg
            });
        }
    };
    Gantt.prototype.make_grid = function () {
        this.make_grid_background();
        this.make_grid_rows();
        this.make_grid_header();
        this.make_grid_ticks();
        this.make_grid_highlights();
        this.make_legend();
    };
    Gantt.prototype.make_grid_background = function () {
        var rect = {
            height: this.options.header_height +
                this.options.padding +
                (this.options.bar_height + this.options.padding) * this.tasks.length,
            width: this.dates.length * this.options.column_width + 150
        };
        createSVG('rect', __assign({ x: 0, y: 0 }, rect, { class: 'grid-background', append_to: this.layers.grid }));
        $.attr(this.$svg, rect);
    };
    Gantt.prototype.make_grid_rows = function () {
        var _this = this;
        var rows_layer = createSVG('g', { append_to: this.layers.grid });
        var lines_layer = createSVG('g', { append_to: this.layers.grid });
        var row_width = this.dates.length * this.options.column_width;
        var row_height = this.options.bar_height + this.options.padding;
        var row_y = this.options.header_height + this.options.padding / 2;
        this.tasks.forEach(function (task) {
            createSVG('rect', {
                x: 150,
                y: row_y,
                width: row_width,
                height: row_height,
                class: 'grid-row',
                append_to: rows_layer,
                style: { fill: _this.groups[task.group].color }
            });
            createSVG('line', {
                x1: 150,
                y1: row_y + row_height,
                x2: row_width,
                y2: row_y + row_height,
                class: 'grid-row-line',
                append_to: lines_layer,
                style: { stroke: _this.groups[task.group].color }
            });
            row_y += _this.options.bar_height + _this.options.padding;
        });
    };
    Gantt.prototype.make_grid_header = function () {
        var header_width = this.dates.length * this.options.column_width;
        var header_height = this.options.header_height + 10;
        createSVG('rect', {
            x: 0,
            y: 0,
            width: header_width + 150,
            height: header_height,
            class: 'grid-header',
            append_to: this.layers.grid
        });
    };
    Gantt.prototype.make_legend = function () {
        var _this = this;
        var legend_height = this.options.bar_height + this.options.padding;
        var common_attrs = {
            x: 0,
            y: 60,
            width: 150,
            append_to: this.layers.grid
        };
        Array.from(new Set(this.tasks.map(function (t) { return t.group; }))).forEach(function (group) {
            var height = _this.tasks.filter(function (t) { return t.group === group; }).length * legend_height;
            createSVG('rect', __assign({}, common_attrs, { height: height, fill: _this.groups[group].color }));
            var child = document.createElement('div');
            child.className = 'legend';
            var span = document.createElement('span');
            child.appendChild(span);
            span.innerText = group;
            createSVG('foreignObject', __assign({}, common_attrs, { height: height, children: child }));
            common_attrs.y += height;
        });
    };
    Gantt.prototype.make_grid_ticks = function () {
        var tick_x = 150; // padding
        var tick_y = this.options.header_height + this.options.padding / 2;
        var tick_height = (this.options.bar_height + this.options.padding) * this.tasks.length;
        for (var _i = 0, _a = this.dates; _i < _a.length; _i++) {
            var date = _a[_i];
            var tick_class = 'tick';
            // thick tick for monday
            if (this.view_is('Day') && date.getDate() === 1) {
                tick_class += ' thick';
            }
            // thick tick for first week
            if (this.view_is('Week') && date.getDate() >= 1 && date.getDate() < 8) {
                tick_class += ' thick';
            }
            // thick ticks for quarters
            if (this.view_is('Month') && (date.getMonth() + 1) % 3 === 0) {
                tick_class += ' thick';
            }
            createSVG('path', {
                d: "M " + tick_x + " " + tick_y + " v " + tick_height,
                class: tick_class,
                append_to: this.layers.grid
            });
            if (this.view_is('Month')) {
                tick_x += (utils.get_days_in_month(date) * this.options.column_width) / 30;
            }
            else {
                tick_x += this.options.column_width;
            }
        }
    };
    Gantt.prototype.make_grid_highlights = function () {
        // highlight today's date
        if (this.view_is('Day')) {
            var x = (utils.diff(utils.today(), this.gantt_start, 'hour') / this.options.step) *
                this.options.column_width +
                150; // left padding
            var y = 0;
            var width = this.options.column_width;
            var height = (this.options.bar_height + this.options.padding) * this.tasks.length +
                this.options.header_height +
                this.options.padding / 2;
            createSVG('rect', {
                x: x,
                y: y,
                width: width,
                height: height,
                class: 'today-highlight',
                append_to: this.layers.grid
            });
        }
    };
    Gantt.prototype.make_dates = function () {
        for (var _i = 0, _a = this.get_dates_to_draw(); _i < _a.length; _i++) {
            var date = _a[_i];
            createSVG('text', {
                x: date.lower_x + 150,
                y: date.lower_y,
                innerHTML: date.lower_text,
                class: 'lower-text',
                append_to: this.layers.date
            });
            if (date.upper_text) {
                var $upper_text = createSVG('text', {
                    x: date.upper_x,
                    y: date.upper_y,
                    innerHTML: date.upper_text,
                    class: 'upper-text',
                    append_to: this.layers.date
                });
                // remove out-of-bound dates
                if ($upper_text.getBBox().x2 > this.layers.grid.getBBox().width) {
                    $upper_text.remove();
                }
            }
        }
    };
    Gantt.prototype.get_dates_to_draw = function () {
        var _this = this;
        var last_date = null;
        return this.dates.map(function (date, i) {
            var d = _this.get_date_info(date, last_date, i);
            last_date = date;
            return d;
        });
    };
    Gantt.prototype.get_date_info = function (date, last_date, i) {
        if (!last_date) {
            last_date = utils.add(date, 1, 'year');
        }
        var date_text = {
            'Quarter Day_lower': utils.format(date, 'HH', this.options.language),
            'Half Day_lower': utils.format(date, 'HH', this.options.language),
            Day_lower: date.getDate() !== last_date.getDate() ? utils.format(date, 'D', this.options.language) : '',
            Week_lower: date.getMonth() !== last_date.getMonth()
                ? utils.format(date, 'D MMM', this.options.language)
                : utils.format(date, 'D', this.options.language),
            Month_lower: utils.format(date, 'MMMM', this.options.language),
            Year_lower: utils.format(date, 'YYYY', this.options.language),
            'Quarter Day_upper': date.getDate() !== last_date.getDate() ? utils.format(date, 'D MMM', this.options.language) : '',
            'Half Day_upper': date.getDate() !== last_date.getDate()
                ? date.getMonth() !== last_date.getMonth()
                    ? utils.format(date, 'D MMM', this.options.language)
                    : utils.format(date, 'D', this.options.language)
                : '',
            Day_upper: date.getMonth() !== last_date.getMonth() ? utils.format(date, 'MMMM', this.options.language) : '',
            Week_upper: date.getMonth() !== last_date.getMonth() ? utils.format(date, 'MMMM', this.options.language) : '',
            Month_upper: date.getFullYear() !== last_date.getFullYear()
                ? utils.format(date, 'YYYY', this.options.language)
                : '',
            Year_upper: date.getFullYear() !== last_date.getFullYear()
                ? utils.format(date, 'YYYY', this.options.language)
                : ''
        };
        var base_pos = {
            x: i * this.options.column_width,
            lower_y: this.options.header_height,
            upper_y: this.options.header_height - 25
        };
        var x_pos = {
            'Quarter Day_lower': (this.options.column_width * 4) / 2,
            'Quarter Day_upper': 0,
            'Half Day_lower': (this.options.column_width * 2) / 2,
            'Half Day_upper': 0,
            Day_lower: this.options.column_width / 2,
            Day_upper: (this.options.column_width * 30) / 2,
            Week_lower: 0,
            Week_upper: (this.options.column_width * 4) / 2,
            Month_lower: this.options.column_width / 2,
            Month_upper: (this.options.column_width * 12) / 2,
            Year_lower: this.options.column_width / 2,
            Year_upper: (this.options.column_width * 30) / 2
        };
        return {
            upper_text: date_text[this.options.view_mode + "_upper"],
            lower_text: date_text[this.options.view_mode + "_lower"],
            upper_x: base_pos.x + x_pos[this.options.view_mode + "_upper"],
            upper_y: base_pos.upper_y,
            lower_x: base_pos.x + x_pos[this.options.view_mode + "_lower"],
            lower_y: base_pos.lower_y
        };
    };
    Gantt.prototype.make_bars = function () {
        var _this = this;
        this.bars = this.tasks.map(function (task) {
            task.color = _this.groups[task.group].color;
            var bar = new Bar(_this, task);
            _this.layers.bar.appendChild(bar.group);
            return bar;
        });
    };
    Gantt.prototype.make_arrows = function () {
        var _this = this;
        this.arrows = [];
        var _loop_1 = function (task) {
            var arrows = [];
            arrows = task.dependencies
                .map(function (task_id) {
                var dependency = _this.get_task(task_id);
                if (!dependency) {
                    return;
                }
                var arrow = new Arrow(_this, _this.bars[dependency._index], // from_task
                _this.bars[task._index] // to_task
                );
                _this.layers.arrow.appendChild(arrow.element);
                return arrow;
            })
                .filter(function (a) { return !!a; }); // filter falsy values
            this_1.arrows = this_1.arrows.concat(arrows);
        };
        var this_1 = this;
        for (var _i = 0, _a = this.tasks; _i < _a.length; _i++) {
            var task = _a[_i];
            _loop_1(task);
        }
    };
    Gantt.prototype.map_arrows_on_bars = function () {
        var _loop_2 = function (bar) {
            bar.arrows = this_2.arrows.filter(function (arrow) {
                return arrow.from_task.task.id === bar.task.id || arrow.to_task.task.id === bar.task.id;
            });
        };
        var this_2 = this;
        for (var _i = 0, _a = this.bars; _i < _a.length; _i++) {
            var bar = _a[_i];
            _loop_2(bar);
        }
    };
    Gantt.prototype.set_width = function () {
        var cur_width = this.$svg.getBoundingClientRect().width;
        var actual_width = this.$svg.querySelector('.grid .grid-row').getAttribute('width');
        if (cur_width < actual_width) {
            this.$svg.setAttribute('width', actual_width);
        }
    };
    Gantt.prototype.set_scroll_position = function () {
        if (!this.options.auto_scroll) {
            return;
        }
        var parent_element = this.$svg.parentElement;
        if (!parent_element) {
            return;
        }
        var hours_before_first_task = utils.diff(this.get_oldest_starting_date(), this.gantt_start, 'hour');
        parent_element.scrollLeft =
            (hours_before_first_task / this.options.step) * this.options.column_width - this.options.column_width;
    };
    Gantt.prototype.bind_grid_click = function () {
        var _this = this;
        $.on(this.$svg, this.options.popup_trigger, '.grid-row, .grid-header', function () {
            _this.unselect_all();
            _this.hide_popup();
        });
    };
    Gantt.prototype.bind_bar_events = function () {
        var _this = this;
        var is_dragging = false;
        if (!this.options.interactive) {
            return;
        }
        var x_on_start = 0;
        var is_resizing_left = false;
        var is_resizing_right = false;
        var parent_bar_id = null;
        var bars = []; // instanceof Bar
        this.bar_being_dragged = null;
        function action_in_progress() {
            return is_dragging || is_resizing_left || is_resizing_right;
        }
        $.on(this.$svg, 'mousedown', '.bar-wrapper, .handle', (function (e, element) {
            var bar_wrapper = $.closest('.bar-wrapper', element);
            if (element.classList.contains('left')) {
                is_resizing_left = true;
            }
            else if (element.classList.contains('right')) {
                is_resizing_right = true;
            }
            else if (element.classList.contains('bar-wrapper')) {
                is_dragging = true;
            }
            bar_wrapper.classList.add('active');
            x_on_start = e.offsetX;
            parent_bar_id = bar_wrapper.getAttribute('data-id');
            var ids = [parent_bar_id].concat(_this.get_all_dependent_tasks(parent_bar_id));
            bars = ids.map(function (id) { return _this.get_bar(id); });
            _this.bar_being_dragged = parent_bar_id;
            bars.forEach(function (bar) {
                var $bar = bar.$bar;
                $bar.ox = $bar.getX();
                $bar.oy = $bar.getY();
                $bar.owidth = $bar.getWidth();
                $bar.finaldx = 0;
            });
        }));
        $.on(this.$svg, 'mousemove', function (e) {
            if (!action_in_progress()) {
                return;
            }
            var dx = e.offsetX - x_on_start;
            bars.forEach(function (bar) {
                var $bar = bar.$bar;
                $bar.finaldx = _this.get_snap_position(dx);
                if (is_resizing_left) {
                    if (parent_bar_id === bar.task.id) {
                        bar.update_bar_position({
                            x: $bar.ox + $bar.finaldx,
                            width: $bar.owidth - $bar.finaldx
                        });
                    }
                    else {
                        bar.update_bar_position({
                            x: $bar.ox + $bar.finaldx
                        });
                    }
                }
                else if (is_resizing_right) {
                    if (parent_bar_id === bar.task.id) {
                        bar.update_bar_position({
                            width: $bar.owidth + $bar.finaldx
                        });
                    }
                }
                else if (is_dragging) {
                    bar.update_bar_position({ x: $bar.ox + $bar.finaldx });
                }
            });
        });
        document.addEventListener('mouseup', function () {
            if (is_dragging || is_resizing_left || is_resizing_right) {
                bars.forEach(function (bar) { return bar.group.classList.remove('active'); });
            }
            is_dragging = false;
            is_resizing_left = false;
            is_resizing_right = false;
        });
        $.on(this.$svg, 'mouseup', function () {
            _this.bar_being_dragged = null;
            bars.forEach(function (bar) {
                var $bar = bar.$bar;
                if (!$bar.finaldx) {
                    return;
                }
                bar.date_changed();
                bar.set_action_completed();
            });
        });
        this.bind_bar_progress();
    };
    Gantt.prototype.bind_bar_progress = function () {
        var _this = this;
        var x_on_start = 0;
        var is_resizing = null;
        var bar = null;
        var $bar_progress = null;
        var $bar = null;
        $.on(this.$svg, 'mousedown', '.handle.progress', (function (e, handle) {
            is_resizing = true;
            x_on_start = e.offsetX;
            var $bar_wrapper = $.closest('.bar-wrapper', handle);
            var id = $bar_wrapper.getAttribute('data-id');
            bar = _this.get_bar(id);
            $bar_progress = bar.$bar_progress;
            $bar = bar.$bar;
            $bar_progress.finaldx = 0;
            $bar_progress.owidth = $bar_progress.getWidth();
            $bar_progress.min_dx = -$bar_progress.getWidth();
            $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
        }));
        $.on(this.$svg, 'mousemove', function (e) {
            if (!is_resizing) {
                return;
            }
            var dx = e.offsetX - x_on_start;
            if (dx > $bar_progress.max_dx) {
                dx = $bar_progress.max_dx;
            }
            if (dx < $bar_progress.min_dx) {
                dx = $bar_progress.min_dx;
            }
            var $handle = bar.$handle_progress;
            $.attr($bar_progress, 'width', $bar_progress.owidth + dx);
            $.attr($handle, 'points', bar.get_progress_polygon_points());
            $bar_progress.finaldx = dx;
        });
        $.on(this.$svg, 'mouseup', function () {
            is_resizing = false;
            if (!($bar_progress && $bar_progress.finaldx)) {
                return;
            }
            bar.progress_changed();
            bar.set_action_completed();
        });
    };
    Gantt.prototype.get_all_dependent_tasks = function (task_id) {
        var _this = this;
        var out = [];
        var to_process = [task_id];
        while (to_process.length) {
            var deps = to_process.reduce(function (acc, curr) {
                acc = acc.concat(_this.dependency_map[curr]);
                return acc;
            }, []);
            out = out.concat(deps);
            to_process = deps.filter(function (d) { return !to_process.includes(d); });
        }
        return out.filter(Boolean);
    };
    Gantt.prototype.get_snap_position = function (dx) {
        var odx = dx;
        var rem;
        var position;
        if (this.view_is('Week')) {
            rem = dx % (this.options.column_width / 7);
            position = odx - rem + (rem < this.options.column_width / 14 ? 0 : this.options.column_width / 7);
        }
        else if (this.view_is('Month')) {
            rem = dx % (this.options.column_width / 30);
            position = odx - rem + (rem < this.options.column_width / 60 ? 0 : this.options.column_width / 30);
        }
        else {
            rem = dx % this.options.column_width;
            position = odx - rem + (rem < this.options.column_width / 2 ? 0 : this.options.column_width);
        }
        return position;
    };
    Gantt.prototype.get_task = function (id) {
        return this.tasks.find(function (task) {
            return task.id === id;
        });
    };
    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    Gantt.prototype.get_oldest_starting_date = function () {
        return this.tasks.map(function (task) { return task._start; }).reduce(function (prev_date, cur_date) {
            return cur_date <= prev_date ? cur_date : prev_date;
        });
    };
    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    Gantt.prototype.clear = function () {
        this.$svg.innerHTML = '';
    };
    return Gantt;
}());
function generate_id(task) {
    return (task.name +
        '_' +
        Math.random()
            .toString(36)
            .slice(2, 12));
}

export { Gantt };
