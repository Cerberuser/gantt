// tslint:disable:variable-name
// tslint:disable:object-literal-sort-keys

import Arrow from './arrow';
import Bar from './bar';
import date_utils from './date_utils';
import Popup, { IPopupOptions } from './popup';
import {
    $,
    createSVG,
} from './svg_utils';

import './gantt.less';

export interface ITask {
    id: string;
    name: string;
    start: Date | string;
    end: Date | string;
    progress?: number;
    dependencies?: string;
    custom_class?: string;
    group?: string;
    custom_data?: string;
}

export interface ITaskInternal extends Pick<ITask, Exclude<keyof ITask, 'dependencies'>> {
    color?: string;
    _start: Date;
    _end: Date;
    _index: number;
    dependencies: string[];
    invalid: boolean;
}

export const enum ViewMode {
    QuarterDay = 'Quarter Day',
    HalfDay = 'Half Day',
    Day = 'Day',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year',
}

export interface IOptions {
    auto_scroll: boolean;
    click_trigger: boolean;
    interactive: boolean;
    header_height: number;
    column_width: number;
    step: number;
    view_modes: ViewMode[];
    bar_height: number;
    bar_corner_radius: number;
    arrow_curve: number;
    padding: number;
    view_mode: ViewMode;
    date_format: string;
    popup_trigger: keyof HTMLElementEventMap;
    custom_popup_html: (task: ITaskInternal) => string;
    language: 'en' | 'ru' | 'ptBr';
}

const colors = [
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
    '#99abf9',
];
const getColor = (index: number) => colors[index % colors.length];

export class Gantt {
    public options: IOptions = null;
    public bar_being_dragged: string;
    public gantt_start: Date;
    private $svg: SVGElement = null;
    private $container: HTMLElement = null;
    private popup_wrapper: HTMLElement = null;
    private tasks: ITaskInternal[];
    private dependency_map: Record<string, string[]>;
    private gantt_end: Date;
    private dates: Date[];
    private layers: Record<string, SVGGraphicsElement>;
    private bars: Bar[];
    private arrows: Arrow[];
    private popup: Popup;
    private groups: Record<string, { color: string }>;

    // in fact, it's more strict, but let it be as such for now

    constructor(wrapper: Element, tasks: ITask[], options: Partial<IOptions>) {
        this.setup_wrapper(wrapper);
        this.setup_options(options);
        this.setup_tasks(tasks);
        // initialize with default view mode
        this.change_view_mode();
        this.bind_events();
    }

    public setup_wrapper(element: Element) {
        let svg_element;
        let wrapper_element;

        // CSS Selector is passed
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        // get the SVGElement
        if (element instanceof HTMLElement) {
            wrapper_element = element;
            svg_element = element.querySelector('svg');
        } else if (element instanceof SVGElement) {
            svg_element = element;
        } else {
            throw new TypeError(
                'Frappé Gantt only supports usage of a string CSS selector,' +
                ' HTML DOM element or SVG DOM element for the \'element\' parameter',
            );
        }

        // svg element
        if (!svg_element) {
            // create it
            this.$svg = createSVG('svg', {
                append_to: wrapper_element,
                class: 'gantt',
            });
        } else {
            this.$svg = svg_element;
            this.$svg.classList.add('gantt');
        }

        // wrapper element
        this.$container = document.createElement('div');
        this.$container.classList.add('gantt-container');

        const parent_element = this.$svg.parentElement;
        parent_element.appendChild(this.$container);
        this.$container.appendChild(this.$svg);

        // popup wrapper
        this.popup_wrapper = document.createElement('div');
        this.popup_wrapper.classList.add('popup-wrapper');
        this.$container.appendChild(this.popup_wrapper);
    }

    public setup_options(options: Partial<IOptions>) {
        const default_options: IOptions = {
            auto_scroll: false,
            click_trigger: false,
            interactive: false,
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: [
                ViewMode.QuarterDay,
                ViewMode.HalfDay,
                ViewMode.Day,
                ViewMode.Week,
                ViewMode.Month,
                ViewMode.Year,
            ],
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            view_mode: ViewMode.Day,
            date_format: 'YYYY-MM-DD',
            popup_trigger: 'click',
            custom_popup_html: null,
            language: 'en',
        };
        this.options = Object.assign({}, default_options, options);
    }

    public setup_tasks(tasks: ITask[]) {
        // prepare tasks
        this.tasks = tasks.map((_task, i) => {
            const task = _task as unknown as ITaskInternal; // hack to get around typing problems
            // convert to Date objects
            task._start = date_utils.parse(task.start);
            task._end = date_utils.parse(task.end);

            // make task invalid if duration too large
            if (date_utils.diff(task._end, task._start, 'year') > 10) {
                task.end = null;
            }

            // cache index
            task._index = i;

            // invalid dates
            if (!task.start && !task.end) {
                const today = date_utils.today();
                task._start = today;
                task._end = date_utils.add(today, 2, 'day');
            }

            if (!task.start && task.end) {
                task._start = date_utils.add(task._end, -2, 'day');
            }

            if (task.start && !task.end) {
                task._end = date_utils.add(task._start, 2, 'day');
            }

            // if hours is not set, assume the last day is full day
            // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
            const task_end_values = date_utils.get_date_values(task._end);
            if (task_end_values.slice(3).every((d) => d === 0)) {
                task._end = date_utils.add(task._end, 24, 'hour');
            }

            // invalid flag
            if (!task.start || !task.end) {
                task.invalid = true;
            }

            // dependencies
            if (typeof task.dependencies === 'string' || !task.dependencies) {
                let deps: string[] = [];
                if (task.dependencies) {
                    deps = (task.dependencies as unknown as string)
                        .split(',')
                        .map((d) => d.trim())
                        .filter((d) => d);
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
    }

    public setup_dependencies() {
        this.dependency_map = {};
        for (const t of this.tasks) {
            for (const d of t.dependencies) {
                this.dependency_map[d] = this.dependency_map[d] || [];
                this.dependency_map[d].push(t.id);
            }
        }
    }

    public setup_groups() {
        this.groups = {};
        let groupsCount = 0;
        this.tasks.forEach((task) => {
            if (!this.groups[task.group]) {
                groupsCount++;
                this.groups[task.group] = {color: getColor(groupsCount)};
            }
        });
    }

    public refresh(tasks: ITask[]) {
        this.setup_tasks(tasks);
        this.change_view_mode();
    }

    public change_view_mode(mode: ViewMode = this.options.view_mode) {
        this.update_view_scale(mode);
        if (this.tasks.length === 0) {
            return;
        }
        this.setup_dates();
        this.render();
        // fire viewmode_change event
        this.trigger_event('view_change', [mode]);
    }

    public update_view_scale(view_mode: ViewMode) {
        this.options.view_mode = view_mode;

        if (view_mode === 'Day') {
            this.options.step = 24;
            this.options.column_width = 38;
        } else if (view_mode === 'Half Day') {
            this.options.step = 24 / 2;
            this.options.column_width = 38;
        } else if (view_mode === 'Quarter Day') {
            this.options.step = 24 / 4;
            this.options.column_width = 38;
        } else if (view_mode === 'Week') {
            this.options.step = 24 * 7;
            this.options.column_width = 140;
        } else if (view_mode === 'Month') {
            this.options.step = 24 * 30;
            this.options.column_width = 120;
        } else if (view_mode === 'Year') {
            this.options.step = 24 * 365;
            this.options.column_width = 120;
        }
    }

    public setup_dates() {
        this.setup_gantt_dates();
        this.setup_date_values();
    }

    public setup_gantt_dates() {
        this.gantt_start = this.gantt_end = null;

        for (const task of this.tasks) {
            // set global start and end date
            if (!this.gantt_start || task._start < this.gantt_start) {
                this.gantt_start = task._start;
            }
            if (!this.gantt_end || task._end > this.gantt_end) {
                this.gantt_end = task._end;
            }
        }

        this.gantt_start = date_utils.start_of(this.gantt_start, 'day');
        this.gantt_end = date_utils.start_of(this.gantt_end, 'day');

        // add date padding on both sides
        if (this.view_is(['Quarter Day', 'Half Day'])) {
            this.gantt_start = date_utils.add(this.gantt_start, -7, 'day');
            this.gantt_end = date_utils.add(this.gantt_end, 7, 'day');
        } else if (this.view_is('Month')) {
            this.gantt_start = date_utils.start_of(this.gantt_start, 'year');
            this.gantt_end = date_utils.add(this.gantt_end, 1, 'year');
        } else if (this.view_is('Year')) {
            this.gantt_start = date_utils.add(this.gantt_start, -2, 'year');
            this.gantt_end = date_utils.add(this.gantt_end, 2, 'year');
        } else {
            this.gantt_start = date_utils.add(this.gantt_start, -1, 'month');
            this.gantt_end = date_utils.add(this.gantt_end, 1, 'month');
        }
    }

    public setup_date_values() {
        this.dates = [];
        let cur_date = null;

        while (
            cur_date === null ||
            cur_date < this.gantt_end ||
            this.dates.length * this.options.column_width + 150 < this.$container.offsetWidth
            ) {
            if (!cur_date) {
                cur_date = date_utils.clone(this.gantt_start);
            } else {
                if (this.view_is('Year')) {
                    cur_date = date_utils.add(cur_date, 1, 'year');
                } else if (this.view_is('Month')) {
                    cur_date = date_utils.add(cur_date, 1, 'month');
                } else {
                    cur_date = date_utils.add(
                        cur_date,
                        this.options.step,
                        'hour',
                    );
                }
            }
            this.dates.push(cur_date);
        }
    }

    public bind_events() {
        this.bind_grid_click();
        this.bind_bar_events();
    }

    public render() {
        this.clear();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_bars();
        this.make_arrows();
        this.map_arrows_on_bars();
        this.set_width();
        this.set_scroll_position();
    }

    public setup_layers() {
        this.layers = {};
        const layers = ['grid', 'date', 'arrow', 'progress', 'bar', 'details'];
        // make group layers
        for (const layer of layers) {
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg,
            });
        }
    }

    public make_grid() {
        this.make_grid_background();
        this.make_grid_rows();
        this.make_grid_header();
        this.make_grid_ticks();
        this.make_grid_highlights();
        this.make_legend();
    }

    public make_grid_background() {
        const rect = {
            height: this.options.header_height +
                this.options.padding +
                (this.options.bar_height + this.options.padding) *
                this.tasks.length,
            width: this.dates.length * this.options.column_width + 150,
        };
        createSVG('rect', {
            x: 0,
            y: 0,
            ...rect,
            class: 'grid-background',
            append_to: this.layers.grid,
        });
        $.attr(this.$svg, rect);
    }

    public make_grid_rows() {
        const rows_layer = createSVG('g', {append_to: this.layers.grid});
        const lines_layer = createSVG('g', {append_to: this.layers.grid});

        const row_width = this.dates.length * this.options.column_width;
        const row_height = this.options.bar_height + this.options.padding;

        let row_y = this.options.header_height + this.options.padding / 2;

        this.tasks.forEach((task) => {
            createSVG('rect', {
                x: 150,
                y: row_y,
                width: row_width,
                height: row_height,
                class: 'grid-row',
                append_to: rows_layer,
                style: {fill: this.groups[task.group].color},
            });

            createSVG('line', {
                x1: 150,
                y1: row_y + row_height,
                x2: row_width,
                y2: row_y + row_height,
                class: 'grid-row-line',
                append_to: lines_layer,
                style: {stroke: this.groups[task.group].color},
            });

            row_y += this.options.bar_height + this.options.padding;
        });
    }

    public make_grid_header() {
        const header_width = this.dates.length * this.options.column_width;
        const header_height = this.options.header_height + 10;
        createSVG('rect', {
            x: 0,
            y: 0,
            width: header_width + 150,
            height: header_height,
            class: 'grid-header',
            append_to: this.layers.grid,
        });
    }

    public make_legend() {
        const legend_height = this.options.bar_height + this.options.padding;
        const common_attrs = {
            x: 0,
            y: 60,
            width: 150,
            append_to: this.layers.grid,
        };
        Array.from(new Set(this.tasks.map((t) => t.group))).forEach((group, i) => {
            const height = this.tasks.filter((t) => t.group === group).length * legend_height;
            createSVG('rect', {
                ...common_attrs,
                height,
                fill: this.groups[group].color,
            });
            const child = document.createElement('div');
            child.className = 'legend';
            const span = document.createElement('span');
            child.appendChild(span);
            span.innerText = group;
            createSVG('foreignObject', {
                ...common_attrs,
                height,
                children: child,
            });
            common_attrs.y += height;
        });
    }

    public make_grid_ticks() {
        let tick_x = 0;
        const tick_y = this.options.header_height + this.options.padding / 2;
        const tick_height =
            (this.options.bar_height + this.options.padding) *
            this.tasks.length;

        for (const date of this.dates) {
            let tick_class = 'tick';
            // thick tick for monday
            if (this.view_is('Day') && date.getDate() === 1) {
                tick_class += ' thick';
            }
            // thick tick for first week
            if (
                this.view_is('Week') &&
                date.getDate() >= 1 &&
                date.getDate() < 8
            ) {
                tick_class += ' thick';
            }
            // thick ticks for quarters
            if (this.view_is('Month') && (date.getMonth() + 1) % 3 === 0) {
                tick_class += ' thick';
            }

            createSVG('path', {
                d: `M ${tick_x} ${tick_y} v ${tick_height}`,
                class: tick_class,
                append_to: this.layers.grid,
            });

            if (this.view_is('Month')) {
                tick_x +=
                    date_utils.get_days_in_month(date) *
                    this.options.column_width /
                    30;
            } else {
                tick_x += this.options.column_width;
            }
        }
    }

    public make_grid_highlights() {
        // highlight today's date
        if (this.view_is('Day')) {
            const x =
                date_utils.diff(date_utils.today(), this.gantt_start, 'hour') /
                this.options.step *
                this.options.column_width;
            const y = 0;

            const width = this.options.column_width;
            const height =
                (this.options.bar_height + this.options.padding) *
                this.tasks.length +
                this.options.header_height +
                this.options.padding / 2;

            createSVG('rect', {
                x,
                y,
                width,
                height,
                class: 'today-highlight',
                append_to: this.layers.grid,
            });
        }
    }

    public make_dates() {
        for (const date of this.get_dates_to_draw()) {
            createSVG('text', {
                x: date.lower_x + 150,
                y: date.lower_y,
                innerHTML: date.lower_text,
                class: 'lower-text',
                append_to: this.layers.date,
            });

            if (date.upper_text) {
                const $upper_text = createSVG('text', {
                    x: date.upper_x,
                    y: date.upper_y,
                    innerHTML: date.upper_text,
                    class: 'upper-text',
                    append_to: this.layers.date,
                });

                // remove out-of-bound dates
                if (
                    ($upper_text.getBBox() as any).x2 > this.layers.grid.getBBox().width
                ) {
                    $upper_text.remove();
                }
            }
        }
    }

    public get_dates_to_draw() {
        let last_date: Date = null;
        const dates = this.dates.map((date, i) => {
            const d = this.get_date_info(date, last_date, i);
            last_date = date;
            return d;
        });
        return dates;
    }

    public get_date_info(date: Date, last_date: Date, i: number) {
        if (!last_date) {
            last_date = date_utils.add(date, 1, 'year');
        }
        const date_text: any = {
            'Quarter Day_lower': date_utils.format(
                date,
                'HH',
                this.options.language,
            ),
            'Half Day_lower': date_utils.format(
                date,
                'HH',
                this.options.language,
            ),
            'Day_lower':
                date.getDate() !== last_date.getDate()
                    ? date_utils.format(date, 'D', this.options.language)
                    : '',
            'Week_lower':
                date.getMonth() !== last_date.getMonth()
                    ? date_utils.format(date, 'D MMM', this.options.language)
                    : date_utils.format(date, 'D', this.options.language),
            'Month_lower': date_utils.format(date, 'MMMM', this.options.language),
            'Year_lower': date_utils.format(date, 'YYYY', this.options.language),
            'Quarter Day_upper':
                date.getDate() !== last_date.getDate()
                    ? date_utils.format(date, 'D MMM', this.options.language)
                    : '',
            'Half Day_upper':
                date.getDate() !== last_date.getDate()
                    ? date.getMonth() !== last_date.getMonth()
                    ? date_utils.format(date, 'D MMM', this.options.language)
                    : date_utils.format(date, 'D', this.options.language)
                    : '',
            'Day_upper':
                date.getMonth() !== last_date.getMonth()
                    ? date_utils.format(date, 'MMMM', this.options.language)
                    : '',
            'Week_upper':
                date.getMonth() !== last_date.getMonth()
                    ? date_utils.format(date, 'MMMM', this.options.language)
                    : '',
            'Month_upper':
                date.getFullYear() !== last_date.getFullYear()
                    ? date_utils.format(date, 'YYYY', this.options.language)
                    : '',
            'Year_upper':
                date.getFullYear() !== last_date.getFullYear()
                    ? date_utils.format(date, 'YYYY', this.options.language)
                    : '',
        };

        const base_pos = {
            x: i * this.options.column_width,
            lower_y: this.options.header_height,
            upper_y: this.options.header_height - 25,
        };

        const x_pos: any = {
            'Quarter Day_lower': this.options.column_width * 4 / 2,
            'Quarter Day_upper': 0,
            'Half Day_lower': this.options.column_width * 2 / 2,
            'Half Day_upper': 0,
            'Day_lower': this.options.column_width / 2,
            'Day_upper': this.options.column_width * 30 / 2,
            'Week_lower': 0,
            'Week_upper': this.options.column_width * 4 / 2,
            'Month_lower': this.options.column_width / 2,
            'Month_upper': this.options.column_width * 12 / 2,
            'Year_lower': this.options.column_width / 2,
            'Year_upper': this.options.column_width * 30 / 2,
        };

        return {
            upper_text: date_text[`${this.options.view_mode}_upper`],
            lower_text: date_text[`${this.options.view_mode}_lower`],
            upper_x: base_pos.x + x_pos[`${this.options.view_mode}_upper`],
            upper_y: base_pos.upper_y,
            lower_x: base_pos.x + x_pos[`${this.options.view_mode}_lower`],
            lower_y: base_pos.lower_y,
        };
    }

    public make_bars() {
        this.bars = this.tasks.map((task) => {
            task.color = this.groups[task.group].color;
            const bar = new Bar(this, task);
            this.layers.bar.appendChild(bar.group);
            return bar;
        });
    }

    public make_arrows() {
        this.arrows = [];
        for (const task of this.tasks) {
            let arrows = [];
            arrows = task.dependencies
                .map((task_id) => {
                    const dependency = this.get_task(task_id);
                    if (!dependency) {
                        return;
                    }
                    const arrow = new Arrow(
                        this,
                        this.bars[dependency._index], // from_task
                        this.bars[task._index], // to_task
                    );
                    this.layers.arrow.appendChild(arrow.element);
                    return arrow;
                })
                .filter(Boolean); // filter falsy values
            this.arrows = this.arrows.concat(arrows);
        }
    }

    public map_arrows_on_bars() {
        for (const bar of this.bars) {
            bar.arrows = this.arrows.filter((arrow) => {
                return (
                    arrow.from_task.task.id === bar.task.id ||
                    arrow.to_task.task.id === bar.task.id
                );
            });
        }
    }

    public set_width() {
        const cur_width = this.$svg.getBoundingClientRect().width as unknown as string;
        const actual_width = this.$svg
            .querySelector('.grid .grid-row')
            .getAttribute('width');
        if (cur_width < actual_width) {
            this.$svg.setAttribute('width', actual_width);
        }
    }

    public set_scroll_position() {
        if (!this.options.auto_scroll) {
            return;
        }
        const parent_element = this.$svg.parentElement;
        if (!parent_element) {
            return;
        }

        const hours_before_first_task = date_utils.diff(
            this.get_oldest_starting_date(),
            this.gantt_start,
            'hour',
        );

        const scroll_pos =
            hours_before_first_task /
            this.options.step *
            this.options.column_width -
            this.options.column_width;

        parent_element.scrollLeft = scroll_pos;
    }

    public bind_grid_click() {
        $.on(
            this.$svg,
            this.options.popup_trigger,
            '.grid-row, .grid-header',
            () => {
                this.unselect_all();
                this.hide_popup();
            },
        );
    }

    public bind_bar_events() {
        let is_dragging = false;
        if (!this.options.interactive) {
            return;
        }
        let x_on_start = 0;
        let y_on_start = 0;
        let is_resizing_left = false;
        let is_resizing_right = false;
        let parent_bar_id: string = null;
        let bars: Bar[] = []; // instanceof Bar
        this.bar_being_dragged = null;

        function action_in_progress() {
            return is_dragging || is_resizing_left || is_resizing_right;
        }

        $.on(this.$svg, 'mousedown', '.bar-wrapper, .handle', ((e: any, element: any) => {
            const bar_wrapper = $.closest('.bar-wrapper', element);

            if (element.classList.contains('left')) {
                is_resizing_left = true;
            } else if (element.classList.contains('right')) {
                is_resizing_right = true;
            } else if (element.classList.contains('bar-wrapper')) {
                is_dragging = true;
            }

            bar_wrapper.classList.add('active');

            x_on_start = e.offsetX;
            y_on_start = e.offsetY;

            parent_bar_id = bar_wrapper.getAttribute('data-id');
            const ids = [
                parent_bar_id,
                ...this.get_all_dependent_tasks(parent_bar_id),
            ];
            bars = ids.map((id) => this.get_bar(id));

            this.bar_being_dragged = parent_bar_id;

            bars.forEach((bar) => {
                const $bar: any = bar.$bar;
                $bar.ox = $bar.getX();
                $bar.oy = $bar.getY();
                $bar.owidth = $bar.getWidth();
                $bar.finaldx = 0;
            });
        }) as any);

        $.on(this.$svg, 'mousemove', (e: any) => {
            if (!action_in_progress()) {
                return;
            }
            const dx = e.offsetX - x_on_start;
            const dy = e.offsetY - y_on_start;

            bars.forEach((bar) => {
                const $bar: any = bar.$bar;
                $bar.finaldx = this.get_snap_position(dx);

                if (is_resizing_left) {
                    if (parent_bar_id === bar.task.id) {
                        bar.update_bar_position({
                            x: $bar.ox + $bar.finaldx,
                            width: $bar.owidth - $bar.finaldx,
                        });
                    } else {
                        bar.update_bar_position({
                            x: $bar.ox + $bar.finaldx,
                        });
                    }
                } else if (is_resizing_right) {
                    if (parent_bar_id === bar.task.id) {
                        bar.update_bar_position({
                            width: $bar.owidth + $bar.finaldx,
                        });
                    }
                } else if (is_dragging) {
                    bar.update_bar_position({x: $bar.ox + $bar.finaldx});
                }
            });
        });

        document.addEventListener('mouseup', (e) => {
            if (is_dragging || is_resizing_left || is_resizing_right) {
                bars.forEach((bar) => bar.group.classList.remove('active'));
            }

            is_dragging = false;
            is_resizing_left = false;
            is_resizing_right = false;
        });

        $.on(this.$svg, 'mouseup', (e) => {
            this.bar_being_dragged = null;
            bars.forEach((bar) => {
                const $bar: any = bar.$bar;
                if (!$bar.finaldx) {
                    return;
                }
                bar.date_changed();
                bar.set_action_completed();
            });
        });

        this.bind_bar_progress();
    }

    public bind_bar_progress() {
        let x_on_start = 0;
        let y_on_start = 0;
        let is_resizing: boolean = null;
        let bar: Bar = null;
        let $bar_progress: any = null;
        let $bar = null;

        $.on(this.$svg, 'mousedown', '.handle.progress', ((e: any, handle: any) => {
            is_resizing = true;
            x_on_start = e.offsetX;
            y_on_start = e.offsetY;

            const $bar_wrapper = $.closest('.bar-wrapper', handle);
            const id = $bar_wrapper.getAttribute('data-id');
            bar = this.get_bar(id);

            $bar_progress = bar.$bar_progress;
            $bar = bar.$bar;

            $bar_progress.finaldx = 0;
            $bar_progress.owidth = $bar_progress.getWidth();
            $bar_progress.min_dx = -$bar_progress.getWidth();
            $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
        }) as any);

        $.on(this.$svg, 'mousemove', (e: any) => {
            if (!is_resizing) {
                return;
            }
            let dx = e.offsetX - x_on_start;
            const dy = e.offsetY - y_on_start;

            if (dx > $bar_progress.max_dx) {
                dx = $bar_progress.max_dx;
            }
            if (dx < $bar_progress.min_dx) {
                dx = $bar_progress.min_dx;
            }

            const $handle = bar.$handle_progress;
            $.attr($bar_progress, 'width', $bar_progress.owidth + dx);
            $.attr($handle, 'points', bar.get_progress_polygon_points());
            $bar_progress.finaldx = dx;
        });

        $.on(this.$svg, 'mouseup', () => {
            is_resizing = false;
            if (!($bar_progress && $bar_progress.finaldx)) {
                return;
            }
            bar.progress_changed();
            bar.set_action_completed();
        });
    }

    public get_all_dependent_tasks(task_id: string) {
        let out: string[] = [];
        let to_process = [task_id];
        while (to_process.length) {
            const deps = to_process.reduce((acc, curr) => {
                acc = acc.concat(this.dependency_map[curr]);
                return acc;
            }, []);

            out = out.concat(deps);
            to_process = deps.filter((d) => !to_process.includes(d));
        }

        return out.filter(Boolean);
    }

    public get_snap_position(dx: number) {
        const odx = dx;
        let rem;
        let position;

        if (this.view_is('Week')) {
            rem = dx % (this.options.column_width / 7);
            position =
                odx -
                rem +
                (rem < this.options.column_width / 14
                    ? 0
                    : this.options.column_width / 7);
        } else if (this.view_is('Month')) {
            rem = dx % (this.options.column_width / 30);
            position =
                odx -
                rem +
                (rem < this.options.column_width / 60
                    ? 0
                    : this.options.column_width / 30);
        } else {
            rem = dx % this.options.column_width;
            position =
                odx -
                rem +
                (rem < this.options.column_width / 2
                    ? 0
                    : this.options.column_width);
        }
        return position;
    }

    public unselect_all() {
        Array.from(this.$svg.querySelectorAll('.bar-wrapper')).forEach((el) => {
            el.classList.remove('active');
        });
    }

    public view_is(modes: string | string[]) {
        if (typeof modes === 'string') {
            return this.options.view_mode === modes;
        }

        if (Array.isArray(modes)) {
            return modes.some((mode) => this.options.view_mode === mode);
        }

        return false;
    }

    public get_task(id: string) {
        return this.tasks.find((task) => {
            return task.id === id;
        });
    }

    public get_bar(id: string): any {
        return this.bars.find((bar) => {
            return bar.task.id === id;
        });
    }

    public show_popup(options: Partial<IPopupOptions>) {
        if (!this.popup) {
            this.popup = new Popup(
                this.popup_wrapper,
                this.options.custom_popup_html,
            );
        }
        this.popup.show(options);
    }

    public hide_popup() {
        if (this.popup) {
            this.popup.hide();
        }
    }

    public trigger_event(event: string, args: any) {
        if ((this.options as any)['on_' + event]) {
            (this.options as any)['on_' + event].apply(null, args);
        }
    }

    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    public get_oldest_starting_date() {
        return this.tasks
            .map((task) => task._start)
            .reduce(
                (prev_date, cur_date) =>
                    cur_date <= prev_date ? cur_date : prev_date,
            );
    }

    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    public clear() {
        this.$svg.innerHTML = '';
    }
}

function generate_id(task: ITaskInternal | ITask) {
    return (
        task.name +
        '_' +
        Math.random()
            .toString(36)
            .slice(2, 12)
    );
}
