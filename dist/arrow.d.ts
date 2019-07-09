import Bar from './bar';
import { Gantt } from './index';
export default class Arrow {
    element: SVGGraphicsElement | null;
    from_task: Bar;
    to_task: Bar;
    private gantt;
    private path;
    constructor(gantt: Gantt, from_task: Bar, to_task: Bar);
    update(): void;
    private calculate_path;
    private draw;
}
