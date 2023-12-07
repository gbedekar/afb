import Chart from '../chartClass.js';

export default class SidekickTotalLineChart extends Chart {
  constructor(cfg) {
    super(cfg);
    this.cfg = cfg;
  }

  setData(data) {
    this.data = data;
  }

  setEchart(echart) {
    this.echart = echart;
  }

  configureEchart(options) {
    this.options = options;
  }

  extraDomOperations(chartElement) {
    super.extraDomOperations(chartElement);
  }

  drawChart() {
    if (typeof echarts === 'undefined') {
      window.setTimeout(this.drawChart.bind(this), 5);
    } else {
      const currBlock = document.querySelector(`div#${this.cfg.chartId}`);
      // eslint-disable-next-line no-undef
      this.echart = echarts.init(currBlock, { renderer: 'canvas' });
      this.extraDomOperations(currBlock);
      if (!Object.hasOwn(window, 'chartGroup')) {
        window.chartGroup = [];
      }
      this.echart.group = 'group1';
      window.chartGroup.push(this.echart);
      const endpoint = this.cfg.data;
      const legendEndpoint = this.cfg['legend-data'];
      const flag = `${endpoint}Flag`;
      const legendFlag = `${legendEndpoint}Flag`;

      if (((Object.hasOwn(window, flag) && window[flag] === true) || !Object.hasOwn(window, flag))
      || (legendEndpoint && ((Object.hasOwn(window, legendFlag) && window[legendFlag] === true)
    || !Object.hasOwn(window, legendFlag)))) {
        window.setTimeout(this.drawChart.bind(this), 5);
      } else if (Object.hasOwn(window, flag) && window[flag] === false) {
        // query complete, hide loading graphic
        this.data = window.dashboard[this.cfg.data].results.data;
        document.querySelectorAll('div.loading').forEach((loading) => {
          loading.style.display = 'none';
        });

        const lbl = this.cfg['label-key'];
        const reverseData = [...this.data].reverse();

        const labels = reverseData.map((row) => {
          const res = row[`${lbl}`];
          return res.length > 10 ? res.substring(0, 10) : res;
        });

        const series = reverseData.map((row) => row[`${this.cfg.field}`]);
        const title = this.cfg.label;
        const params = new URLSearchParams(window.location.href);
        let opts;

        if (legendEndpoint && Object.hasOwn(window.dashboard, legendEndpoint) && this.data) {
          const legendArr = ['day'];
          const legendMap = {};
          this.year_map = {};
          let lastDay;
          const dataset = [];
          let lastRow = {};
          this.data.forEach((row) => {
            const { day, checkpoint, invocations } = row;
            if (!lastDay) {
              lastDay = day;
            }
            if (lastDay && !(day === lastDay)) {
              dataset.push(lastRow);
              lastDay = day;
              lastRow = {};
            }
            if (!Object.hasOwn(lastRow, 'day')) {
              lastRow.day = day;
            }
            lastRow[checkpoint.substring(9)] = parseInt(invocations, 10);
            if (!Object.hasOwn(legendMap, checkpoint)) {
              const arr = [];
              legendMap[checkpoint] = arr;
              legendArr.push(checkpoint.replace('sidekick:', ''));
            }
          });
          this.legendArray = legendArr;
          const seriesType = [];
          for (let i = 1; i < this.legendArray.length; i += 1) {
            seriesType.push({ type: 'line' });
          }
          opts = {
            title: {
              text: endpoint === 'multiline-sidekick' ? 'Sidekick Usage (ALL URLS)' : 'Sidekick Usage (Only *.hlx.*)',
              x: 'center',
            },
            legend: {
              orient: 'horizontal',
              extraCssText: 'width: 100%; margin: 0px; padding: 0px;',
              bottom: 0,
              x: 'left',
              y: 'bottom',
            },
            toolbox: {
              feature: {
                restore: {},
                saveAsImage: {},
              },
            },
            dataZoom: [
              {
                type: 'inside',
                show: false,
                start: 0,
                end: 100,
              },
            ],
            tooltip: {
              enterable: true,
              trigger: 'axis',
              confine: true,
              extraCssText: 'width: fit-content; height: fit-content;',
              order: 'valueDesc',
            },
            dataset: {
              dimensions: this.legendArray,
              source: dataset,
            },
            xAxis: { type: 'category' },
            yAxis: {
              type: 'log',
              min: 'dataMin',
              max: 'dataMax',
              logBase: 10,
            },
            series: seriesType,
          };
        } else {
          opts = {
            title: {
              text: `${title}\n${params.get('url')}`,
              x: 'center',
            },
            lineStyle: {
              color: `#${(0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6)}`,
            },
            toolbox: {
              feature: {
                restore: {},
                saveAsImage: {},
              },
            },
            dataZoom: [
              {
                type: 'inside',
                show: false,
                start: 0,
                end: 100,
              },
            ],
            xAxis: {
              type: 'category',
              triggerEvent: true,
              data: labels,
              axisLabel: {
                show: true,
                interval: 1,
                rotate: 70,
              },
            },
            yAxis: {
              type: 'log',
              min: 'dataMin',
              max: 'dataMax',
              logBase: 10,
            },
            series: [
              {
                data: series,
                type: 'line',
                smooth: true,
                symbol: 'none',
                itemStyle: {
                  color: `#${(0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6)}`,
                },
              },
            ],
          };
        }
        this.configureEchart(opts);
        this.echart.setOption(opts);
        this.hideLoader(this.cfg.block);
        if (!Object.hasOwn(window, 'connected')) {
          window.connected = 0;
          window.connected += 1;
        } else {
          window.connected += 1;
          if (window.connected === 2) {
            /* eslint-disable no-undef */
            echarts.connect('group1');
            echarts.connect(window.chartGroup);
          }
        }
      }
    }
  }
}