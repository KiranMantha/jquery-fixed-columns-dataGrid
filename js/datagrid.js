/*
    The repo can be found at https://github.com/KiranMantha/jquery-fixed-columns-dataGrid

    example:
    $('#example').dataGrid({
        left: 2,
        right: 2,
        head: true,
        containerId: id-attribute-of-the-target-table-parent,
        containerHeight: in-px || in-vh || in-percentage
    });
    $('#example').dataGrid('destroy');
    $('#example').dataGrid('refresh');
*/
(function ($) {

    var defaults = {
        head: true,
        foot: false,
        left: 0,
        right: 0,
        containerId: '',
        containerHeight: '50vh',
        containerWidth: '100vw',
        'z-index': 4
    };

    var DataGrid = function(element, params) {
        var settings = $.extend({}, defaults, params);
        settings.table = element;
        settings.parent = $('#' + settings.containerId);
        settings.leftColumns = $();
        settings.rightColumns = $();
        settings.Headers = $();
        this._settings = settings;
        this._setup();
    }

    DataGrid.prototype = {
        constructor: DataGrid,
        _settings: {},
        _setParent: function(parent) {
            // Set style of table parent
            var _this = this;
            parent
                .css({
                    'overflow-x': 'auto',
                    'overflow-y': 'auto',
                    //'max-height': settings.containerHeight,
                    'height': this._settings.containerHeight,
                    'width': this._settings.containerWidth
                });

            parent.scroll(function (e) {
                var scrollWidth = parent[0].scrollWidth;
                var clientWidth = parent[0].clientWidth;
                var scrollHeight = parent[0].scrollHeight;
                var clientHeight = parent[0].clientHeight;
                var top = parent.scrollTop();
                var left = parent.scrollLeft();

                if (_this._settings.head)
                    $(e.currentTarget).find("thead tr > *").css("top", top);

                if (_this._settings.foot)
                    $(e.currentTarget).find("tfoot tr > *").css("bottom", scrollHeight - clientHeight - top);

                if (_this._settings.left > 0)
                    _this._settings.leftColumns.css("left", left);

                if (_this._settings.right > 0)
                    _this._settings.rightColumns.css("right", scrollWidth - clientWidth - left);
            }.bind(this._settings.table));
        },
        _setCorner: function(table) {
            /*
                This function solver z-index problem in corner cell where fix row and column at the same time,
                set corner cells z-index 1 more then other fixed cells
            */
            
            var _this = this;
            
            if (this._settings.head) {
                if (this._settings.left > 0) {
                    var tr = $(table).find("thead tr:first-child");

                    tr.each(function (k, row) {
                        if ($(row).children().length > 0) {
                            _this._solverLeftColspan(row, function (cell) {
                                _this._settings.leftColumns = _this._settings.leftColumns.add(cell);
                            });                            
                        }
                    });
                }

                if (this._settings.right > 0) {
                    var tr = $(table).find("thead tr:first-child");

                    tr.each(function (k, row) {
                        if ($(row).children().length > 0) {
                            _this._solveRightColspan(row, function (cell) {
                                _this._settings.rightColumns = _this._settings.rightColumns.add(cell);
                            });
                        }
                    });
                }

                if (this._settings.head)
                    this._fixHead();
            }
        },
        _fixHead: function() {
            // Set table head fixed
            var _this = this;
            var thead = $(this._settings.table).find("thead");
            
            thead.find("tr").each(function (k, row) {
                var cells = $(row).find('th');
                _this._setBackground(cells);
                cells.css({
                    'position': 'relative',
                    'z-index': _this._settings['z-index'] + 2
                });
            });
            $(this._settings.table).css({
                'border-collapse': 'separate',
                'border-spacing': '0'                
            });
        },
        _fixLeft: function() {
            // Set table left column fixed

            var tbody = $(this._settings.table).find('tbody'),
                _this = this;
            
            tbody.find("tr").each(function (k, row) {
                if ($(row).children().length > 0) {
                    _this._solverLeftColspan(row, function (cell) {
                        _this._settings.leftColumns = _this._settings.leftColumns.add(cell);
                    });
                }
            });

            var column = this._settings.leftColumns;

            column.each(function (k, cell) {
                var cell = $(cell);
                _this._setBackground(cell);
                if (cell[0].nodeName === "TH") {
                    cell.css({
                        'position': 'relative',
                        'z-index': _this._settings['z-index'] + 3
                    });
                } else {
                    cell.css({
                        'position': 'relative',
                        'z-index': _this._settings['z-index'] - 1
                    });
                }
            });
        },
        _clearHead: function() {
            //clear thead cells styles

            $(this._settings.table).find("thead tr > *").each(function (k, cell) {
                $(cell).removeAttr('style');
            });
            $(this._settings.table).css({ 'border-spacing': '', 'border-collapse': '' });
        },
        _clearLeft: function() {
            // clear all styles on left fixed cells
            
            this._settings.leftColumns.each(function (k, cell) {
                $(cell).removeAttr('style');
            });
            this._settings.leftColumns = $();
        },        
        _fixRight: function() {
            // Set table right column fixed

            var tbody = $(this._settings.table).find('tbody'),
                _this = this;

            tbody.find('tr').each(function (k, row) {
                if ($(row).children().length > 0) {
                    _this._solveRightColspan(row, function (cell) {
                        _this._settings.rightColumns = _this._settings.rightColumns.add(cell);
                    });
                }
            });

            var column = this._settings.rightColumns;

            column.each(function (k, cell) {
                var cell = $(cell);
                _this._setBackground(cell);
                if (cell[0].nodeName === "TH") {
                    cell.css({
                        'position': 'relative',
                        'z-index': _this._settings['z-index'] + 3
                    });
                } else {
                    cell.css({
                        'position': 'relative',
                        'z-index': _this._settings['z-index'] - 1
                    });
                }                
            });
        },
        _clearRight: function() {
            // clear all styles on right fixed cells
            this._settings.rightColumns.each(function (k, cell) {
                $(cell).removeAttr('style');
            });
            this._settings.rightColumns = $();
        },
        _setBackground: function(elements) {
            // Set fixed cells backgrounds
            elements.each(function (k, element) {
                var element = $(element);
                var parent = $(element).parent();

                var elementBackground = element.css("background-color");
                elementBackground = (elementBackground == "transparent" || elementBackground == "rgba(0, 0, 0, 0)") ? null : elementBackground;

                var parentBackground = parent.css("background-color");
                parentBackground = (parentBackground == "transparent" || parentBackground == "rgba(0, 0, 0, 0)") ? null : parentBackground;

                var background = parentBackground ? parentBackground : "#fff";
                background = elementBackground ? elementBackground : background;
                if (element.nodeName === 'TH')
                    element.css("background-color", '#fff');
                else
                    element.css("background-color", background);
            });
        },
        _solverLeftColspan: function(row, action) {
            var fixColumn = this._settings.left;
            var inc = 1;

            for (var i = 1; i <= fixColumn; i = i + inc) {
                var nth = inc > 1 ? i - 1 : i;

                var cell = $(row).find("> *:nth-child(" + nth + ")");
                var colspan = cell.prop("colspan");

                if (cell.cellPos().left < fixColumn) {
                    action(cell);
                }
                inc = colspan;
            }
        },
        _solveRightColspan: function(row, action) {
            var fixColumn = this._settings.right;
            var inc = 1;

            for (var i = 1; i <= fixColumn; i = i + inc) {
                var nth = inc > 1 ? i - 1 : i;

                var cell = $(row).find("> *:nth-last-child(" + nth + ")");
                var colspan = cell.prop("colspan");
                action(cell);
                inc = colspan;
            }
        },
        _setup: function() {   
            var _this = this;         
            this._setParent(this._settings.parent);
            this._setCorner(this._settings.table);
    
            if (this._settings.left > 0)
                this._fixLeft();
            if (this._settings.right > 0)
                this._fixRight();
            
            $(this._settings.parent).trigger("scroll");
            $(window).resize(function () {
                $(_this._settings.parent).trigger("scroll");
            });
        },
        refresh: function () {
            //rebind the modified table with dataGrid
            this._clearLeft();
            this._clearRight();
            this._clearHead();
            this._setup();
        },
        // destroy dataGrid
        destroy: function () {
            $(this._settings.parent).removeAttr('style');
            if (this._settings.head)
                this._clearHead();
            if (this._settings.left > 0)
                this._clearLeft();
            if (this._settings.right > 0)
                this._clearRight();
        }
    }

    var dataGridPlugin = function (params) {
        var args = Array.apply(null, arguments),
            internal_return;
		args.shift();
        this.each(function () {
            var data = $(this).data('dataGrid');
            if(!data) {
                var opts = typeof params === 'object' && params;
                data = new DataGrid(this, opts);
                $(this).data('dataGrid', data);
            }

            if (typeof params === 'string' && typeof data[params] === 'function'){
				internal_return = data[params].apply(data, args);
            }
            
            if (
                internal_return === undefined ||
                internal_return instanceof DataGrid
            ) {
                return this;
            } else {
                return internal_return;
            }
        });
    }

    $.fn.dataGrid = dataGridPlugin;

    $.fn.dataGrid.Constructor = DataGrid;
})(jQuery);

/*  cellPos jQuery plugin
    ---------------------
    Get visual position of cell in HTML table (or its block like thead).
    Return value is object with "top" and "left" properties set to row and column index of top-left cell corner.
    Example of use:
    $("#myTable tbody td").each(function(){
    $(this).text( $(this).cellPos().top +", "+ $(this).cellPos().left );
    });
*/
(function ($) {
    /* scan individual table and set "cellPos" data in the form { left: x-coord, top: y-coord } */
    function scanTable($table) {
        var m = [];
        $table.children("tr").each(function (y, row) {
            $(row).children("td, th").each(function (x, cell) {
                var $cell = $(cell),
                    cspan = $cell.attr("colspan") | 0,
                    rspan = $cell.attr("rowspan") | 0,
                    tx, ty;
                cspan = cspan ? cspan : 1;
                rspan = rspan ? rspan : 1;
                for (; m[y] && m[y][x]; ++x); //skip already occupied cells in current row
                for (tx = x; tx < x + cspan; ++tx) { //mark matrix elements occupied by current cell with true
                    for (ty = y; ty < y + rspan; ++ty) {
                        if (!m[ty]) { //fill missing rows
                            m[ty] = [];
                        }
                        m[ty][tx] = true;
                    }
                }
                var pos = {
                    top: y,
                    left: x
                };
                $cell.data("cellPos", pos);
            });
        });
    };

    /* plugin */
    $.fn.cellPos = function (rescan) {
        var $cell = this.first(),
            pos = $cell.data("cellPos");
        if (!pos || rescan) {
            var $table = $cell.closest("table, thead, tbody, tfoot");
            scanTable($table);
        }
        pos = $cell.data("cellPos");
        return pos;
    }
})(jQuery);
