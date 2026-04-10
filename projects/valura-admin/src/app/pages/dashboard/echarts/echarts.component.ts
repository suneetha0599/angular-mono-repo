import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as echarts from 'echarts';
@Component({
  selector: 'echarts',
  imports: [],
  templateUrl: './echarts.component.html',
  styleUrl: './echarts.component.scss'
})
export class EchartsComponent implements AfterViewInit, OnChanges {
  @Input() type: 'line' | 'pie' | 'bar' | 'map' | 'scatter' | 'stackedBar' | 'pie_risks' | 'assessment_pie' = 'line';
  @Input() title: string = 'Chart';
  @Input() xAxisData: string[] = [];
  @Input() seriesData: any = [];
  @Input() seriesName: string = 'Data';
  @Input() orientation: 'horizontal' | 'vertical' = 'vertical'; // for bar charts
  @Input() pieStyle: 'donut' | 'full' = 'donut'; // for pie charts
  @Input() centerText: string = '';
  @Input() height: string = '280px';
  @Input() colors: string[] = [];
  private chartInstance!: echarts.ECharts;

  constructor(private el: ElementRef, private http: HttpClient) { }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOninit() {
    // this.http.get('assets/maps/world.geo.json').subscribe((geoJson: any) => {
    //   echarts.registerMap('world', geoJson);    // Register map
    // });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.chartInstance) {
      this.renderChart();
    }
  }

  async renderChart(): Promise<void> {
    const dom = this.el.nativeElement.querySelector('#dynamicChart');
    if (!this.chartInstance) {
      this.chartInstance = echarts.init(dom);
    }

    let option: echarts.EChartsOption;
    if (this.type === 'bar') {
      const isHorizontal = this.orientation === 'horizontal';

      option = {
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: isHorizontal ? 'value' : 'category',
          data: isHorizontal ? undefined : ['A', 'B', 'C', 'D', 'E', 'F'],
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: isHorizontal ? 'category' : 'value',
          data: isHorizontal ? ['A', 'B', 'C', 'D', 'E'] : undefined,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { color: '#6b7280' }
        },
        series: [
          {
            type: 'bar',
            data: [
              {
                value: 21,
                itemStyle: { color: 'rgba(225, 2, 255, 0.96)' }
              },
              {
                value: 32,
                itemStyle: { color: 'rgba(224, 204, 53, 0.96)' }
              },
              {
                value: 42,
                itemStyle: { color: 'rgba(4, 146, 255, 0.82)' }
              },
              {
                value: 31,
                itemStyle: { color: 'rgba(144, 243, 114, 0.81)' }
              },
              {
                value: isHorizontal ? undefined : 40,
                itemStyle: { color: 'rgba(222, 27, 27, 0.81)' }
              },
            ],
            itemStyle: {
              borderRadius: 4
            }
          }
        ],
        color: ['#6366f1', '#06b6d4', '#f472b6', '#facc15']
      };
    }

    else if (
      this.type === 'pie' ||
      this.type === 'pie_risks' ||
      this.type === 'assessment_pie'
    ) {

      const isDonut = this.pieStyle === 'donut';
      const radius =
        this.type === 'pie'
          ? (isDonut ? ['40%', '70%'] : '70%')
          : this.type === 'pie_risks'
            ? (isDonut ? ['50%', '60%'] : '70%')
            : (isDonut ? ['55%', '70%'] : '65%');

      const legendConfig =
        this.type === 'assessment_pie'
          ? { show: false }
          : {
            bottom: this.type === 'pie_risks' ? -5 : '0%',
            left: this.type === 'pie_risks' ? 0 : undefined,
            show: true,
            itemWidth: 10,
            itemHeight: 10,
            icon: this.type === 'pie_risks' ? 'circle' : undefined
          };


      const centerParts = this.centerText ? this.centerText.split('\n') : [];
      const graphicConfig =
        this.centerText && this.type !== 'pie'
          ? this.type === 'pie_risks' && centerParts.length >= 2
            ? [
              {
                type: 'text',
                left: 'center',
                top: '40%',
                style: {
                  text: centerParts[0],
                  fill: ' #161D1D',
                  fontSize: 14,
                  fontWeight: 400,
                  align: 'center',
                  verticalAlign: 'bottom'
                }
              } as any,
              {
                type: 'text',
                left: 'center',
                top: '50%',
                style: {
                  text: centerParts[1],
                  fill: '#767676',
                  fontSize: 12,
                  fontWeight: 400,
                  align: 'center',
                  verticalAlign: 'top'
                }
              } as any
            ]
            : [
              {
                type: 'text',
                left: 'center',
                top: this.type === 'assessment_pie' ? '25%' : 'center',
                style: {
                  text: this.centerText,
                  fill: '#767676',
                  fontSize: 12,
                  fontWeight: 400,
                  align: 'center',
                  verticalAlign: 'middle',
                  lineHeight: 16,
                  overflow: 'break'
                }
              } as any
            ]
          : undefined;

      option = {
        tooltip: { trigger: 'item', appendToBody: true, confine: false },
        legend: legendConfig,
        graphic: graphicConfig,

        series: [
          {
            name:
              this.type === 'pie'
                ? 'Subjects'
                : this.type === 'pie_risks'
                  ? 'Risks'
                  : '',

            type: 'pie',
            radius,
            center:
              this.type === 'assessment_pie'
                ? ['50%', '45%']
                : ['50%', '50%'],

            avoidLabelOverlap: this.type === 'assessment_pie',

            itemStyle: {
              borderRadius: this.type === 'pie' ? 4 : 0,
              borderColor: '#fff',
              borderWidth: 2
            },

            label:
              this.type === 'pie'
                ? {
                  show: true,
                  position: isDonut ? 'center' : 'inner',
                  formatter: (params: any) => `${params.value}%`,
                  fontSize: isDonut ? 16 : 12,
                  color: '#000',
                  fontWeight: isDonut ? 'bold' : 'normal'
                }
                : this.type === 'assessment_pie'
                  ? {
                    show: true,
                    position: 'outside',
                    formatter: (params: any) =>
                      `${params.name}: ${params.value}%`,
                    fontSize: 10,
                    color: '#4B5563',
                    overflow: 'none',
                  }
                  : { show: false },
            labelLayout:
              this.type === 'assessment_pie'
                ? (params: any) => {
                  const chartWidth = this.chartInstance.getWidth();
                  const chartHeight = this.chartInstance.getHeight();
                  if (params.dataIndex === 1) {
                    return {
                      x: 10,
                      y: 10,
                      align: 'left',
                      verticalAlign: 'top'
                    };
                  } else {
                    return {
                      x: chartWidth - 30,
                      y: chartHeight - 30,
                      align: 'right',
                      verticalAlign: 'bottom'
                    };
                  }
                }
                : undefined,
            labelLine:
              this.type === 'assessment_pie'
                ? {
                  show: false,
                  length: 8,
                  length2: 6
                }
                : { show: false },

            emphasis: { label: { show: this.type !== 'pie_risks' } },

            data:
              this.seriesData?.length
                ? this.seriesData
                : [
                  { value: 45, name: 'Employees' },
                  { value: 25, name: 'Customers' },
                  { value: 15, name: 'Vendors' },
                  { value: 15, name: 'Potential Employees' }
                ]
          }
        ],

        color:
          this.colors?.length
            ? this.colors
            : this.type === 'pie_risks'
              ? ['#FF6592', '#1C2B70', '#D7F049']
              : ['#6366f1', '#06b6d4', '#f472b6', '#facc15']
      };
    }

    else if (this.type === 'scatter') {
      option = {
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => `${params.name}<br/>Impact: ${params.value[0]}<br/>Likelihood: ${params.value[1]}`
        },
        xAxis: {
          name: 'Impact',
          min: 68,
          max: 85,
          splitLine: { show: true }
        },
        yAxis: {
          name: 'Likelihood of Risk',
          min: 0,
          max: 10,
          splitLine: { show: true }
        },
        series: [
          {
            type: 'scatter',
            symbolSize: (val: any[]) => val[2],
            label: {
              show: true,
              formatter: '{b}',
              color: '#fff',
              fontWeight: 'bold'
            },
            itemStyle: {
              opacity: 0.8
            },
            data: [
              { name: 'ANL', value: [72, 7, 35], itemStyle: { color: '#ff5c8a' } },
              { name: 'CRM', value: [72, 2, 35], itemStyle: { color: '#fbbf24' } },
              { name: 'CLOUD', value: [75, 5, 55], itemStyle: { color: '#00c4b3' } },
              { name: 'HR', value: [75, 2, 30], itemStyle: { color: '#00c4b3' } },
              { name: 'PAY', value: [78, 5, 90], itemStyle: { color: '#ff6b9a' } },
              { name: 'SUP', value: [81, 10, 40], itemStyle: { color: '#fbbf24' } },
              { name: 'VND', value: [83, 3, 45], itemStyle: { color: '#fbbf24' } },
              { name: 'VND', value: [85, 2, 35], itemStyle: { color: '#00c4b3' } }
            ]

          }
        ]
      };
    } else if (this.type === 'map') {
      const worldMap = await fetch('./assets/custom.geo.json')
        .then(res => res.json())
        .catch(err => {
          console.error('Failed to load map data:', err);
          return null;
        });

      if (!worldMap) return;

      echarts.registerMap('world', worldMap);

      option = {
        tooltip: {
          trigger: 'item'
        },
        visualMap: {
          min: 0,
          max: 800000,
          left: 30,
          bottom: 20,
          text: ['750k', '50k'],
          inRange: {
            color: ['#d3f2e3', '#a9dddb', '#54c3d8', '#007ba7', '#1c2e4a']
          },
          calculable: true,
          itemWidth: 10,
          itemHeight: 100,
          orient: 'horizontal'
        },
        geo: {
          map: 'world',
          roam: true, // Enables zoom/pan
          zoom: 1.2,
          emphasis: {
            label: {
              show: false
            }
          }
        },
        series: [
          {
            type: 'map',
            map: 'world',
            geoIndex: 0,
            data: [
              { name: 'United States', value: 500000 },
              { name: 'India', value: 300000 },
              { name: 'Russia', value: 750000 },
              { name: 'Brazil', value: 100000 },
              { name: 'Australia', value: 250000 },
              { name: 'Nigeria', value: 200000 },
              { name: 'South Africa', value: 150000 },
              { name: 'China', value: 400000 }
            ]
          },
          {
            name: 'Marker Points',
            type: 'scatter',
            coordinateSystem: 'geo',
            symbol: 'circle',
            symbolSize: 10,
            itemStyle: {
              color: 'red'
            },
            data: [
              //   { name: 'Russia', value: [105, 60], itemStyle: { color: 'red' } },
              //   { name: 'India', value: [78, 22], itemStyle: { color: 'red' } },
              //   { name: 'China', value: [104, 35], itemStyle: { color: 'red' } },
              //   { name: 'Australia', value: [133, -25], label: { show: true, formatter: '3', color: '#000', fontWeight: 'bold' }, itemStyle: { color: 'red' } }
            ]
          }
        ]
      };
    } else if (this.type === 'stackedBar') {
      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          bottom: '0%',
          show: true,
          itemWidth: 10,
          itemHeight: 10,
          borderRadius: 50,
          data: ['Consent', 'Contractual', 'Legal Obligation']

        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['Screening', 'Salary Payments', 'Account Creation', 'Email Campaigns', 'Email '],
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { color: '#6b7280' }
        },
        series: [
          {
            barWidth: 40,
            name: 'Consent',
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            itemStyle: { color: '#14d4c9' },
            data: [30, 50, 70, 90, 10]
          },
          {
            name: 'Contractual',
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            itemStyle: { color: '#6b5bff' },
            data: [10, 10, 40, 60, 10]
          },
          {
            name: 'Legal Obligation',
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            itemStyle: { color: '#ffc530' },
            data: [40, 50, 40, 50, 10]
          },
        ],
        barCategoryGap: '5%'
      };
    }
    else if (this.type === 'line') {

      option = {
        tooltip: {
          trigger: 'axis'
        },

        legend: {
          bottom: -5,
          left: 0,
          itemWidth: 15,
          itemHeight: 2,
          itemGap: 25,
        },

        grid: {
          left: '3%',
          right: '8%',
          bottom: '15%',
          top: '5%',
          containLabel: true
        },

        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.seriesData.categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#6B7280' }
        },

        yAxis: {
          type: 'value',
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#F3F4F6' } },
          axisLabel: { color: '#6B7280' }
        },

        series: this.seriesData.series.map((s: any) => ({
          name: s.name,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          lineStyle: { width: 2 },
          data: s.data
        })),

        color: this.colors
      };
    }
    else {
      option = {};
    }

    this.chartInstance.setOption(option);
    window.addEventListener('resize', () => this.chartInstance.resize());
  }
}