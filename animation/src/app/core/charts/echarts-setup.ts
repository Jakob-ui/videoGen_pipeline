// Tree-shaken ECharts build + theme registration (AGENT.md §7.5).
import { BarChart, LineChart, ScatterChart } from 'echarts/charts';
import {
  GraphicComponent,
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { RZ_ECHARTS_THEME, RZ_THEME_NAME } from './rz-echarts-theme';

echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent,
  GraphicComponent,
  SVGRenderer,
]);
echarts.registerTheme(RZ_THEME_NAME, RZ_ECHARTS_THEME);

export { echarts };
