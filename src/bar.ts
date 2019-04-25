// tslint:disable:variable-name
// tslint:disable:object-literal-sort-keys

import Arrow from './arrow';
import date_utils from './date_utils';
import {
    Gantt,
    ITaskInternal,
} from './index';
import {
    $,
    animateSVG,
    createSVG,
} from './svg_utils';

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

export default class Bar {
    public group: SVGElement | null = null;
    public $bar: SVGGraphicsElement | null = null;
    public task: ITaskInternal | null = null;
    public arrows: Arrow[] | null = null;
    public $bar_progress: SVGElement | null = null;
    public $handle_progress: SVGElement | null = null;
    private action_completed: boolean | null = null;
    private gantt: Gantt | null = null;
    private invalid: boolean | null = null;
    private height: number | null = null;
    private x: number | null = null;
    private y: number | null = null;
    private corner_radius: number | null = null;
    private duration: number | null = null;
    private width: number | null = null;
    private progress_width: number | null = null;
    private bar_group: SVGElement | null = null;
    private handle_group: any | null = null;

    constructor(gantt: Gantt, task: ITaskInternal) {
        this.set_defaults(gantt, task);
        this.prepare();
        this.draw();
        this.bind();
    }

    public set_defaults(gantt: Gantt, task: ITaskInternal) {
        this.action_completed = false;
        this.gantt = gantt;
        this.task! = task;
    }

    public prepare() {
        this.prepare_values();
        this.prepare_helpers();
    }

    public prepare_values() {
        this.invalid = this.task!.invalid;
        this.height = this.gantt!.options!.bar_height;
        this.x = this.compute_x();
        this.y = this.compute_y();
        this.corner_radius = this.gantt!.options!.bar_corner_radius;
        this.duration =
            date_utils.diff(this.task!._end, this.task!._start, 'hour') /
            this.gantt!.options!.step;
        this.width = this.gantt!.options!.column_width * this.duration;
        this.progress_width =
            this.gantt!.options!.column_width *
            this.duration *
            (this.task!.progress! / 100) || 0;
        this.group = createSVG('g', {
            'class': 'bar-wrapper ' + (this.task!.custom_class || ''),
            'data-id': this.task!.id,
        });
        this.bar_group = createSVG('g', {
            class: 'bar-group',
            append_to: this.group,
        });
        this.handle_group = createSVG('g', {
            class: 'handle-group',
            append_to: this.group,
        });
    }

    public prepare_helpers() {
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
    }

    public draw() {
        this.draw_bar();
        this.draw_progress_bar();
        this.draw_label();
        this.draw_resize_handles();
    }

    public draw_bar() {
        this.$bar = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'bar',
            append_to: this.bar_group,
            style: {fill: this.task.color},
        });

        animateSVG(this.$bar, 'width', 0, this.width);

        if (this.invalid) {
            this.$bar!.classList.add('bar-invalid');
        }
    }

    public draw_progress_bar() {
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
            style: {fill: this.task!.color},
        });

        animateSVG(this.$bar_progress, 'width', 0, this.progress_width);
    }

    public draw_label() {
        createSVG('text', {
            x: this.x! + this.width! / 2,
            y: this.y! + this.height! / 2,
            innerHTML: this.task!.name,
            class: 'bar-label',
            append_to: this.bar_group,
        });
        // labels get BBox in the next tick
        requestAnimationFrame(() => this.update_label_position());
    }

    public draw_resize_handles() {
        if (this.invalid) {
            return;
        }

        const bar = this.$bar!;
        const handle_width = 8;

        createSVG('rect', {
            x: bar.getX() + bar.getWidth() - 9,
            y: bar.getY() + 1,
            width: handle_width,
            height: this.height! - 2,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'handle right',
            append_to: this.handle_group,
        });

        createSVG('rect', {
            x: bar.getX() + 1,
            y: bar.getY() + 1,
            width: handle_width,
            height: this.height! - 2,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'handle left',
            append_to: this.handle_group,
        });

        if (this.task!.progress! && this.task!.progress! < 100) {
            this.$handle_progress = createSVG('polygon', {
                points: this.get_progress_polygon_points().join(','),
                class: 'handle progress',
                append_to: this.handle_group,
            });
        }
    }

    public get_progress_polygon_points() {
        const bar_progress = this.$bar_progress!;
        return [
            bar_progress.getEndX() - 5,
            bar_progress.getY() + bar_progress.getHeight(),
            bar_progress.getEndX() + 5,
            bar_progress.getY() + bar_progress.getHeight(),
            bar_progress.getEndX(),
            bar_progress.getY() + bar_progress.getHeight() - 8.66,
        ];
    }

    public bind() {
        if (this.invalid) {
            return;
        }
        this.setup_click_event();
        this.setup_hover_event();
    }

    public setup_click_event() {
        if (this.gantt.options.click_trigger) {
            $.on(this.group!, 'focus ' + this.gantt!.options!.popup_trigger, (e) => {
                if (this.action_completed) {
                    // just finished a move action, wait for a few seconds
                    return;
                }

                if (e.type === 'click') {
                    this.gantt!.trigger_event('click', [this.task!]);
                }

                this.gantt!.unselect_all();
                this.group!.classList.toggle('active');

                this.show_popup();
            });
        }
    }

    public setup_hover_event() {
        $.on(this.group, 'mouseover ' + this.gantt.options.popup_trigger, () => {
            this.show_popup();
        });
        $.on(this.group, 'mouseout ' + this.gantt.options.popup_trigger, () => {
            this.gantt.hide_popup();
        });
    }

    public show_popup() {
        if (this.gantt!.bar_being_dragged) {
            return;
        }

        const start_date = date_utils.format(this.task!._start, 'MMM D');
        const end_date = date_utils.format(
            date_utils.add(this.task!._end, -1, 'second'),
            'MMM D',
        );
        const subtitle = start_date + ' - ' + end_date + (this.task.custom_data ? '<br>' + this.task.custom_data : '');

        this.gantt!.show_popup({
            target_element: this.$bar!,
            title: this.task!.name,
            subtitle,
            task: this.task!,
        });
    }

    public update_bar_position({x = undefined, width = undefined}: { x?: number, width?: number }) {
        if (x) {
            // get all x values of parent task
            const xs = this.task!.dependencies.map((dep) => {
                return this.gantt!.get_bar(dep).$bar.getX();
            });
            // child task must not go before parent
            const valid_x = xs.reduce(((_: any, curr: any) => {
                return x >= curr;
            }) as any, x); // why it ever works?!
            if (!valid_x) {
                width = undefined;
                return;
            }
            this.update_attr('x', x);
        }
        if (width && width >= this.gantt!.options!.column_width) {
            this.update_attr('width', width);
        }
        this.update_label_position();
        this.update_handle_position();
        this.update_progressbar_position();
        this.update_arrow_position();
    }

    public date_changed() {
        let changed = false;
        const {new_start_date, new_end_date} = this.compute_start_end_date();

        if (Number(this.task!._start) !== Number(new_start_date)) {
            changed = true;
            this.task!._start = new_start_date;
        }

        if (Number(this.task!._end) !== Number(new_end_date)) {
            changed = true;
            this.task!._end = new_end_date;
        }

        if (!changed) {
            return;
        }

        this.gantt!.trigger_event('date_change', [
            this.task!,
            new_start_date,
            date_utils.add(new_end_date, -1, 'second'),
        ]);
    }

    public progress_changed() {
        const new_progress = this.compute_progress();
        this.task!.progress! = new_progress;
        this.gantt!.trigger_event('progress_change', [this.task!, new_progress]);
    }

    public set_action_completed() {
        this.action_completed = true;
        setTimeout(() => (this.action_completed = false), 1000);
    }

    public compute_start_end_date() {
        const bar = this.$bar!;
        const x_in_units = bar.getX() / this.gantt!.options!.column_width;
        const new_start_date = date_utils.add(
            this.gantt!.gantt_start!,
            x_in_units * this.gantt!.options!.step,
            'hour',
        );
        const width_in_units = bar.getWidth() / this.gantt!.options!.column_width;
        const new_end_date = date_utils.add(
            new_start_date,
            width_in_units * this.gantt!.options!.step,
            'hour',
        );

        return {new_start_date, new_end_date};
    }

    public compute_progress() {
        const progress =
            this.$bar_progress!.getWidth() / this.$bar!.getWidth() * 100;
        return parseInt(progress as any, 10);
    }

    public compute_x() {
        const {step, column_width} = this.gantt!.options!;
        const task_start = this.task!._start;
        const gantt_start = this.gantt!.gantt_start;

        const diffHour = date_utils.diff(task_start, gantt_start, 'hour');
        let x = diffHour / step * column_width;

        if (this.gantt!.view_is('Month')) {
            const diffDay = date_utils.diff(task_start, gantt_start, 'day');
            x = diffDay * column_width / 30;
        }
        return x;
    }

    public compute_y() {
        return (
            this.gantt!.options!.header_height +
            this.gantt!.options!.padding +
            this.task!._index * (this.height! + this.gantt!.options!.padding)
        );
    }

    public get_snap_position(dx: number) {
        const odx = dx;
        let rem;
        let position;

        if (this.gantt!.view_is('Week')) {
            rem = dx % (this.gantt!.options!.column_width / 7);
            position =
                odx -
                rem +
                (rem < this.gantt!.options!.column_width / 14
                    ? 0
                    : this.gantt!.options!.column_width / 7);
        } else if (this.gantt!.view_is('Month')) {
            rem = dx % (this.gantt!.options!.column_width / 30);
            position =
                odx -
                rem +
                (rem < this.gantt!.options!.column_width / 60
                    ? 0
                    : this.gantt!.options!.column_width / 30);
        } else {
            rem = dx % this.gantt!.options!.column_width;
            position =
                odx -
                rem +
                (rem < this.gantt!.options!.column_width / 2
                    ? 0
                    : this.gantt!.options!.column_width);
        }
        return position;
    }

    public update_attr(attr: string, value: any) {
        value = +value;
        if (!isNaN(value)) {
            this.$bar!.setAttribute(attr, value);
        }
        return this.$bar;
    }

    public update_progressbar_position() {
        this.$bar_progress!.setAttribute('x', this.$bar!.getX() as any);
        this.$bar_progress!.setAttribute(
            'width',
            this.$bar!.getWidth() * (this.task!.progress! / 100) as any,
        );
    }

    public update_label_position() {
        const bar = this.$bar!;
        const label = this.group!.querySelector('.bar-label') as SVGSVGElement;

        if (label.getBBox().width > bar.getWidth()) {
            label.classList.add('big');
            // TODO: is this ever optimal?
            let s = label.innerHTML;
            while (s.length > 0 && label.getBBox().width > bar.getWidth()) {
                s = s.slice(0, -1);
            }
            label.innerHTML = s + '...';
        } else {
            label.classList.remove('big');
            label.setAttribute('x', bar.getX() + bar.getWidth() / 2 as any);
        }
    }

    public update_handle_position() {
        const bar = this.$bar!;
        this.handle_group
            .querySelector('.handle.left')
            .setAttribute('x', bar.getX() + 1 as any);
        this.handle_group
            .querySelector('.handle.right')
            .setAttribute('x', bar.getEndX() - 9 as any);
        const handle = this.group!.querySelector('.handle.progress');
        if (handle) {
            handle.setAttribute('points', this.get_progress_polygon_points() as any);
        }
    }

    public update_arrow_position() {
        this.arrows = this.arrows || [];
        for (const arrow of this.arrows) {
            arrow.update();
        }
    }
}
