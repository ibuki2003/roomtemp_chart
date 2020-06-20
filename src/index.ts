import { get_data, ApiRow } from "./api";
import { Chart } from "chart.js";
import * as moment from "moment";
import { AssertionError } from "assert";

interface Datum {
  temp?: number;
  co2?: number;
}
class ChartWrapper {
  readonly timeFormat = "YYYY/MM/DD HH:mm";
  readonly scales: moment.Duration[] = [
    // moment.duration(1000, "days"),
    moment.duration(1, "year"),
    moment.duration(100, "days"),
    moment.duration(30, "days"),
    moment.duration(15, "days"),
    moment.duration(7, "days"),
    moment.duration(1, "days"),
    moment.duration(12, "hours"),
    moment.duration(6, "hours"),
    moment.duration(3, "hours"),
    moment.duration(1, "hours"),
    moment.duration(30, "minutes"),
  ];

  chart: Chart;
  rawdata: { [key: string]: Datum } = {};

  pos: moment.Moment = moment();
  scale_idx = 5;

  get scale() {
    return this.scales[this.scale_idx];
  }

  get range(): { begin: moment.Moment; end: moment.Moment } {
    return {
      begin: this.pos.clone().subtract(this.scale),
      end: this.pos,
    };
  }

  constructor(target: ConstructorParameters<typeof Chart>[0]) {
    this.chart = new Chart(target, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            lineTension: 0,
            label: "temperature",
            yAxisID: "temp",
            fill: false,
            data: [],
            backgroundColor: "#ff000055",
            borderColor: "#ff000033",
            spanGaps: true,
          },
          {
            lineTension: 0,
            label: "carbon-dioxide",
            yAxisID: "co2",
            fill: false,
            data: [],
            backgroundColor: "#0000ff55",
            borderColor: "#0000ff33",
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        showLines: true,
        scales: {
          xAxes: [
            {
              type: "time",
              time: {
                // unit: "minute",
                // stepSize: 5,
                displayFormats: {
                  minute: "HH:mm",
                  hour: "MM-DD HH:mm",
                  day: "YYYY-MM-DD",
                },
                parser: this.timeFormat,
                // round: 'day'
                tooltipFormat: this.timeFormat,
              },
              ticks: {
                min: +this.range.begin.toDate(),
                max: +this.range.end.toDate(),
                beginAtZero: true,
              },
            },
          ],
          yAxes: [
            {
              id: "temp",
              type: "linear",
              position: "left",
            },
            {
              id: "co2",
              type: "linear",
              position: "right",
              ticks: {
                //   max: 1,
                min: 0,
              },
            },
          ],
        },
      },
    });
  }

  draw() {
    if (
      this.chart.data.datasets === undefined ||
      this.chart.config.options === undefined ||
      this.chart.config.options.scales === undefined ||
      this.chart.config.options.scales.xAxes === undefined ||
      this.chart.config.options.scales.xAxes[0].ticks === undefined
    )
      throw new AssertionError();

    const keys = Object.keys(this.rawdata).sort();
    this.chart.data.labels = keys;
    this.chart.data.datasets[0].data = keys.map((k) => this.rawdata[k].temp);
    this.chart.data.datasets[1].data = keys.map((k) => this.rawdata[k].co2);
    this.chart.update({ duration: 0 });

    this.chart.config.options.scales.xAxes[0].ticks.min = this.range.begin.format(
      this.timeFormat
    );
    this.chart.config.options.scales.xAxes[0].ticks.max = this.range.end.format(
      this.timeFormat
    );

    this.chart.update();
  }

  add_row(row: ApiRow) {
    this.rawdata[row.time] = this.rawdata[row.time] || {};
    if (row.temp !== undefined) this.rawdata[row.time].temp = row.temp;
    if (row.co2 !== undefined) this.rawdata[row.time].co2 = row.co2;
  }

  async update() {
    if (Object.keys(this.rawdata).length == 0) {
      (await get_data(this.range.begin, this.range.end)).forEach((a) =>
        this.add_row(a)
      );
    } else {
      const min_x = moment(
        Object.keys(this.rawdata).reduce((mi: string | null, a) => {
          if (mi === null) return a;
          return a < mi ? a : mi;
        }, null)
      );
      const max_x = moment(
        Object.keys(this.rawdata).reduce((mi: string | null, a) => {
          if (mi === null) return a;
          return a > mi ? a : mi;
        }, null)
      ).add(1, "minutes");

      if (min_x > this.range.begin) {
        (await get_data(this.range.begin, min_x)).forEach((a) =>
          this.add_row(a)
        );
      }
      if (max_x < this.range.end) {
        (await get_data(max_x, this.range.end)).forEach((a) => this.add_row(a));
      }
    }

    this.draw();
  }

  zoom_in() {
    if (this.scale_idx + 1 < this.scales.length) this.scale_idx++;
    this.update();
  }

  zoom_out() {
    if (this.scale_idx - 1 >= 0) this.scale_idx--;
    this.update();
  }

  pan_left() {
    this.pos.subtract(
      moment.duration(this.scale.asMilliseconds() / 2, "milliseconds")
    );
    this.update();
  }

  pan_right() {
    this.pos.add(
      moment.duration(this.scale.asMilliseconds() / 2, "milliseconds")
    );
    if (this.pos > moment()) this.pos = moment();
    this.update();
  }
}

const chart = new ChartWrapper(
  document.getElementById("chart") as HTMLCanvasElement
);
chart.update();

document
  // eslint-disable-next-line prettier/prettier
  .getElementById("button_zoomin")?.addEventListener("click", () => chart.zoom_in());

document
  .getElementById("button_zoomout")
  ?.addEventListener("click", () => chart.zoom_out());

document
  .getElementById("button_panleft")
  ?.addEventListener("click", () => chart.pan_left());

document
  .getElementById("button_panright")
  ?.addEventListener("click", () => chart.pan_right());
