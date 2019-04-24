### Install
```
npm install typescript-gantt
```

### Usage
Include it in your HTML:
```
<script src="gantt.min.js"></script>
<link rel="stylesheet" href="gantt.css">
```

And start hacking:
```js
const tasks = [
  {
    id: 'Task 1',
    name: 'Redesign website',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20,
    dependencies: 'Task 2, Task 3',
    custom_class: 'bar-milestone' // optional
  },
  ...
]
const gantt = new Gantt("#gantt", tasks);
```

You can also pass various options to the Gantt constructor:
```js
const gantt = new Gantt("#gantt", tasks, {
    header_height: 50,
    column_width: 30,
    step: 24,
    view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
    bar_height: 20,
    bar_corner_radius: 3,
    arrow_curve: 5,
    padding: 18,
    view_mode: 'Day',   
    date_format: 'YYYY-MM-DD',
    custom_popup_html: null
});
```

If you want to contribute:

1. Clone this repo.
2. `cd` into project directory
3. `yarn`
4. `yarn run dev`

License: MIT

------------------
Base project is created by [frappe](https://github.com/frappe).
