import { IPopupOptions } from './popup';
import './gantt.less';
import './patches';
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
export declare const enum ViewMode {
    QuarterDay = "Quarter Day",
    HalfDay = "Half Day",
    Day = "Day",
    Week = "Week",
    Month = "Month",
    Year = "Year"
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
    custom_popup_html: ((task: ITaskInternal) => string) | null;
    language: 'en' | 'ru' | 'ptBr';
}
export declare class Gantt {
    options: IOptions | null;
    bar_being_dragged: string | null;
    gantt_start: Date | null;
    private $svg;
    private $container;
    private popup_wrapper;
    private tasks;
    private dependency_map;
    private gantt_end;
    private dates;
    private layers;
    private bars;
    private arrows;
    private popup;
    private groups;
    constructor(wrapper: Element, tasks: ITask[], options: Partial<IOptions>);
    unselect_all(): void;
    view_is(modes: string | string[]): boolean;
    get_bar(id: string): any;
    show_popup(options: Partial<IPopupOptions>): void;
    hide_popup(): void;
    trigger_event(event: string, args: any): void;
    refresh(tasks: ITask[]): void;
    private setup_wrapper;
    private setup_options;
    private setup_tasks;
    private setup_dependencies;
    private setup_groups;
    private change_view_mode;
    private update_view_scale;
    private setup_dates;
    private setup_gantt_dates;
    private setup_date_values;
    private bind_events;
    private render;
    private setup_layers;
    private make_grid;
    private make_grid_background;
    private make_grid_rows;
    private make_grid_header;
    private make_legend;
    private make_grid_ticks;
    private make_grid_highlights;
    private make_dates;
    private get_dates_to_draw;
    private get_date_info;
    private make_bars;
    private make_arrows;
    private map_arrows_on_bars;
    private set_width;
    private set_scroll_position;
    private bind_grid_click;
    private bind_bar_events;
    private bind_bar_progress;
    private get_all_dependent_tasks;
    private get_snap_position;
    private get_task;
    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    private get_oldest_starting_date;
    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    private clear;
}
