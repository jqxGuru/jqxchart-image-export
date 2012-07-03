jqxChart/jqxGauge export to image
=====================

Overview
---------------------
The following scripts could be used for exporting [jqxChart](http://jqwidgets.com/ "jqWidgets"), [jqxGauge](http://jqwidgets.com/ "jqWidgets") to image files.
Two types of export are supported:
  1.  Server side export - uses /usr/bin/convert.
  2.  Client side export - uses HTML5 canvas.
The script is using client/server export depending on the user choise and browser features.

Properties
---------------------
*  useCanvas - boolean property which is indicating whether a client side convertion to be used.
*  canvgSrc  - string property which is representing the path to the canvg.js file.
*  rgbSrc    - string property which is representing the path to the rgbColor.js file.

Methods
---------------------
*  exportToPng - exports the chart to PNG file. Accepts a single parameter - the chart that should be exported.
*  exportToJpg - exports the chart to JPG file. Accepts a single parameter - the chart that should be exported.
*  exportToGif - exports the chart to GIF file. Accepts a single parameter - the chart that should be exported.

Sample usage:
---------------------

```
$.jqx.jqxchartExporter({
  canvgSource: '../../scripts/canvg.js',
  rgbSource: '../../scripts/rgbcolor.js',
  useCanvas: true
});

$.jqx.jqxchartExporter.exportToPng('#jqxChart');
```
