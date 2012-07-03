/** @namespace */
$.jqx.jqxchartExporter = (function ($) {

    'use strict';

    /** @private */
    var cssClassesMap = {},
        serverExporter = 'image-export.php',
        widgets = { 'jqxGauge': true, 'jqxChart': true, 'jqxLinearGauge': true },
        useCanvas, canvgSrc, rgbSrc, isVml;

    /** @private */
    function isCanvasSupported() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }

    /** @private */
    function loadCanvg(callback) {
        var canvg = document.createElement('script'),
            rgb = document.createElement('script'),
            loaded = false,
            handler = function () {
                if (loaded) {
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
                loaded = true;
            };
        canvg.src = canvgSrc;
        rgb.src = rgbSrc;
        canvg.onload = handler;
        rgb.onload = handler;
        document.body.appendChild(canvg);
        document.body.appendChild(rgb);
    }

    /** @private */
    function prepareCanvasConvertion(callback) {
        if (typeof canvg === 'undefined') {
            loadCanvg(callback);
        } else {
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    /** @private */
    function getChartCanvas(container) {
        return container.find('.chartContainer')[0];
    }

    /** @private */
    function getElementClass(element) {
        if (element) {
            if (element.className) {
                return element.className;
            } else if (element.getAttribute) {
                return element.getAttribute('class');
            }
        }
    }

    /** @private */
    function getElementClasses(element) {
        var classes = [],
            className = getElementClass(element);
        if (className) {
            if (typeof className !== 'string') {
                if (className.baseVal) {
                    classes = className.baseVal.split(' ');
                }
            } else {
                classes = className.split(' ');
            }
        }
        return classes;
    }

    /** @private */
    function cacheClasses(className) {
        var styleSheets = document.styleSheets,
            rules, rule, i, j;
        for (i = 0; i < styleSheets.length; i += 1) {
            rules = styleSheets[i].rules || styleSheets[i].cssRules || [];
            for (j = 0; j < rules.length; j += 1) {
                rule = rules[j];
                if (rule.selectorText.indexOf(className) >= 0) {
                    cssClassesMap[className] = rule;
                }
            }
        }
    }

    /** @private */
    function getClassStyleSheet(className) {
        if (!cssClassesMap[className]) {
            cacheClasses(className);
        }
        return cssClassesMap[className];
    }

    /** @private */
    function cssProperty(property) {
        property = property.replace(/(-)([a-zA-Z]{1})/g, function (match) {
            return match[1].toUpperCase();
        });
        return property;
    }

    /** @private */
    function setAttr(element, attr, value) {
        if (value) {
            element.style[attr] = value;
        }
    }

    /** @private */
    function addElementStyles(element, styles) {
        var styleValue, style, i;
        if (styles.length) {
            for (i = 0; i < styles.length; i += 1) {
                style = cssProperty(styles[i]);
                setAttr(element, style, styles[style]);
            }
        } else {    //IE
            for (style in styles) {
                styleValue = styles[style];
                setAttr(element, style, styleValue);
            }
        }
    }

    /** @private */
    function handleElementStyleProperties(element, rules) {
        var styles, rule, i;
        for (i = 0; i < rules.length; i += 1) {
            rule = rules[i];
            if (rule) {
                styles = rule.style;
                addElementStyles(element, styles);
            }
        }
    }

    /** @private */
    function translateElementClasses(element) {
        var rules = [],
            classes = [],
            i;
        classes = getElementClasses(element);
        for (i = 0; i < classes.length; i += 1) {
            rules.push(getClassStyleSheet(classes[i]));
        }
        handleElementStyleProperties(element, rules);
        if (element.removeAttribute) {
            element.removeAttribute('class');
        }
    }

    /** @private */
    function translateClassesToStyles(chart) {
        var stack = [chart],
            current,
            childNodes,
            i;
        while (stack.length) {
            current = stack.pop();
            if (current) {
                childNodes = current.childNodes;
                for (i = 0; i < childNodes.length; i += 1) {
                    stack.push(childNodes[i]);
                }
                translateElementClasses(current);
            }
        }
    }

    /** @private */
    function getClonedChart(container) {
        var clone = container.clone();
        clone.css({
            position: 'absolute',
            top: '99999px'
        });
        clone[0].removeAttribute('id');
        clone.appendTo(document.body);
        return clone;
    }

    /** @private */
    function getTranslatedMarkup(container) {
        var clone = getClonedChart(container),
            canvas = getChartCanvas(clone),
            markup = canvas.innerHTML;
        translateClassesToStyles(canvas);
        clone.remove();
        return canvas.innerHTML;
    }

    /** @private */
    function getWidgetType(container) {
        var data = $.data(container[0]);
        for (var p in data) {
            if (widgets[p]) {
                return p;
            }
        }
        return undefined;
    }

    /** @private */
    function refreshWidget(container) {
        var widgetType = getWidgetType(container);
        if (typeof container[widgetType] === 'function') {
            container[widgetType]('refresh');
        }
    }

    /** @private */
    function vmlToSvg(container) {
        var markup;
        document.createElementNS = function (ns, el) {
            return document.createElement(el);
        };
        refreshWidget(container);
        document.createElementNS = undefined;
        markup = getTranslatedMarkup(container);
        refreshWidget(container);
        markup = markup.replace(/([A-Z\-]){1,}:/g, function (match) {
            return match.toLowerCase();
        });
        return markup.replace(/([a-zA-Z]{2,5}=)([a-zA-Z0-9_\-]{1,})/g, '$1"$2"');
    }

    /** @private */
    function getSvgMarkup(container) {
        var markup,
            clone;
        if (isVml) {
            markup = vmlToSvg(container);
        } else {
            markup = getTranslatedMarkup(container);
        }
        return markup;
    }

    /** @private */
    function saveFile(data) {
        if ($.browser.msie) {
            window.location.href = data;
        } else {
            document.location.href = data;
        }
    }

    /** @private */
    function convertByCanvas(svg, width, height, format) {
        var canvas = document.createElement('canvas'),
            parent = document.createElement('div');
        document.body.appendChild(parent);
        parent.appendChild(canvas);
        width -= 1;
        height -= 1;
        parent.style.height = height + 'px';
        parent.style.width = width + 'px';
        canvas.width = width;
        canvas.height = height;
        canvg(canvas, svg);
        saveFile(canvas.toDataURL(format).replace(format, 'image/octet-stream'));
        parent.parentNode.removeChild(parent);
    }

    /** @private */
    function createField(name, value) {
        var field = document.createElement('input');
        field.setAttribute('name', name);
        field.setAttribute('value', value);
        field.setAttribute('type', 'hidden');
        return field;
    }

    /** @private */
    function createForm(image, format, downloadFilename) {
        var form = document.createElement('form'),
            imageInput = createField('image', image),
            formatInput = createField('format', format),
            outputInput = createField('imageName', downloadFilename || 'chart');
        form.setAttribute('method', 'post');
        form.setAttribute('action', serverExporter);
        document.body.appendChild(form);
        form.appendChild(imageInput);
        form.appendChild(formatInput);
        form.appendChild(outputInput);
        return form;
    }

    /** @private */
    function convertByServer(image, format, downloadFilename) {
        var form = createForm(image, format, downloadFilename);
        form.submit();
        form.parentNode.removeChild(form);
    }

    /** @private */
    function exportToImage(container, format) {
        if (typeof container === 'string') {
            container = $(container);
        }
        isVml = typeof document.createElementNS === 'undefined';
        var markup = getSvgMarkup(container);
        if (isCanvasSupported() && useCanvas) {
            prepareCanvasConvertion(function () {
                convertByCanvas(markup, container.width(), container.height(), format);
            });
        } else {
            convertByServer(markup, format);
        }
    }

    /** @scope $.jqx.jqxchartExporter */
    return {

        /**
        * Initializing the exporter plugin. This method could be called on the application setup.
        * If it's not called the default plugin behaviour is going to be used (only server side image export).
        * @param {object} config The configuration object.
        * @config {boolean} [useCanvas] Indicates whether the canvas will be used when it's supported by the browser.
        * @config {string} [canvgSrc] Url to the canvg.js file.
        * @config {string} [rgbSrc] Url to the rgbSrc.js file.
        */
        init: function (config) {
            config = config || {};
            if (config.useCanvas) {
                useCanvas = true;
                if ((!config.canvgSrc && !canvgSrc) || (!config.rgbSrc && !rgbSrc)) {
                    throw new Error('The useCanvas property is true but urls to the canvg library are not provided correctly.');
                } else {
                    canvgSrc = config.canvgSrc;
                    rgbSrc = config.rgbSrc;
                }
            }
        },

        /**
        * Exports the jqxChart to png format.
        * @param {string} chart selector of the jqxChart container.
        */
        exportToPng: function (chart) {
            exportToImage(chart, 'image/png');
        },

        /**
        * Exports the jqxChart to jpg format.
        * @param {string} chart selector of the jqxChart container.
        */
        exportToJpg: function (chart) {
            exportToImage(chart, 'image/jpg');
        },

        /**
        * Exports the jqxChart to gif format.
        * @param {string} chart selector of the jqxChart container.
        */
        exportToGif: function (chart) {
            exportToImage(chart, 'image/gif');
        }
    };
} (jQuery));