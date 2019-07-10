// tslint:disable:object-literal-sort-keys

import { Gantt, IOptions, ITask } from '../src';

beforeAll(
    () =>
        ((SVGElement as any).prototype.getBBox = () => ({
            height: 100,
            width: 100,
            x: 0,
            y: 0
        }))
);

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

    it('should render chart with one task', () => {
        render(
            [
                {
                    id: 'id1',
                    name: 'name1',
                    start: '2019-01-01',
                    end: '2019-01-02'
                }
            ],
            {}
        );
    });
});
