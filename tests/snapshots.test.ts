import { Gantt, IOptions, ITask } from '../src';

function render(tasks: ITask[], options: Partial<IOptions>) {
    document.body.innerHTML = '<div id="container"></div>';
    const container: Element = document.querySelector('#container')!;
    expect(container).not.toBeNull();
    const gantt = new Gantt(container, tasks, options);
    expect(gantt).not.toBeNull();
    expect(container).toMatchSnapshot();
}

describe('Gantt renderer', () => {
    it('should render empty chart', () => {
        render([], {});
    });
});
