/*
    The repo can be found at https://github.com/KiranMantha/jquery-fixed-columns-dataGrid

    example:
    $('#example').dataGrid({
        left: 2,
        head: true,
        containerId: id-propibute-of-the-target-table-parent,
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
            containerId: '',
            containerHeight: '50vh',
            containerWidth: '100vw'
        };
    
        var DataGrid = function (element, params) {
            this.useProp = !!$.fn.prop;
            var settings = $.extend({}, defaults, params);        
            settings.table = $(element);
            settings.containerId = settings.containerId !== "" ? settings.containerId : settings.table.parent()[this.useProp ? 'prop' : 'attr']('id')
            settings.parent = $('#' + settings.containerId);
            settings.leftColumns = settings.Headers = $();
            settings.offset = { top: 0, left: 0 };
            settings['z-index'] = 4;
            this.settings = settings;
            this.grid = {
                sDiv: $(),
                fbDiv: $(),
                fhDiv: $(),
                cDiv: $(),
                headerHeight: 0
            }
            
            this.fixedColTable = this.fixedCornerTable = this.fixedCells = $();
            this._setup();
        }
    
        DataGrid.prototype = {
            constructor: DataGrid,
            settings: {},
            _setDataChangeListener: function () {
                if (this.settings.left > 0) {
                    var _this = this;
                    this.settings.table.find('tbody tr').each(function (i, row) {
                        $(row).on('dataChange', function () {
                            _this.grid.fbDiv.find('tr:nth-child(' + (i + 1) + ')').data($(this).data());
                        });
                    });
    
                    this.grid.fbDiv.find('tr').each(function (i, row) {
                        $(row).on('dataChange', function () {
                            _this.settings.table.find('tbody tr:nth-child(' + (i + 1) + ')').data($(this).data());
                        })
                    });
                }
            },
            _propagateInputChangesFromFixedTable: function () {
                var _this = this;
                if (this.settings.left > 0) {
                    this.grid.fbDiv.find('tr').each(function (i, row) {
                        $(row).on('change keyup', 'input', function (e) {
                            var type = e.currentTarget.type;
                            var index = $(e.currentTarget).closest('td').index() + 1;
                            switch (type) {
                                case 'checkbox': {
                                    _this.settings.table.find('tbody tr:nth-child(' + (i + 1) + ') td:nth-child(' + index + ') input')[_this.useProp ? 'prop' : 'attr']('checked', $(this)[_this.useProp ? 'prop' : 'attr']('checked'));
                                    break;
                                }
                                case 'text': {
                                    _this.settings.table.find('tbody tr:nth-child(' + (i + 1) + ') td:nth-child(' + index + ') input').val($(this).val());
                                    break;
                                }
                            }
                        });
    
                        $(row).on('change', 'select', function (e) {
                            var index = $(e.currentTarget).closest('td').index() + 1;
                            _this.settings.table.find('tbody tr:nth-child(' + (i + 1) + ') td:nth-child(' + index + ') select').val($(this).val());
                        });
                    })
                }
            },
            _getCells: function (selector) {
                return this.settings.table.find(selector);
            },
            _columnBuilder: function (colCount, selector) {
                var columnSelector = [];
                for (var i = 0; i < colCount; i++) {
                    columnSelector.push(selector + ':nth-child(' + (i + 1) + ')');
                }
                return columnSelector.join(',');
            },
            _cloneCells: function ($cells, columnCount, maxRows) {
                var cells = [], rows = [];
    
                for (var i = 0; i < $cells.length; i++) {
                    var td = $cells[i];
                    cells.push($(td).clone(true));
    
                    // skip columns when colspan is specified
                    i += td.colSpan - 1;
    
                    if (i % columnCount === columnCount - 1) {
                        var p = $($(td).closest('tr')),
                            row = $('<tr>');                    
                        var parentAttr = p.attr();
                        if (parentAttr) {
                            Object.keys(parentAttr).forEach(function (key) {
                                row.attr(key, parentAttr[key]);
                            });
                        }
                        rows.push(row.append(cells).data(p.data()));
                        if (rows.length > maxRows) {
                            break;
                        }
                        cells = [];
                    }
                }
                return rows;
            },
            _wrapActuals: function () {
                var sbDiv = $('<div></div>').css({
                    'position': 'relative',
                    'overflow': 'auto',
                    'height': this.settings.containerHeight,
                    'width': this.settings.containerWidth
                });
                this.settings.table.wrap(sbDiv);
                this.grid.headerHeight = this.settings.table.find('thead')[0].clientHeight;
                return this.settings.table.parent();
            },
            _setParent: function () {
                this.settings.parent.css({
                    'position': 'relative',
                    'width': this.settings.containerWidth,
                    'overflow': 'hidden',
                    'left': '0',
                    'top': '0'
                });
            },
            _setCorner: function () {
                this.grid.cDiv = $('<div>').css({
                    'overflow': 'hidden',
                    'position': 'absolute',
                    'top': '0',
                    'left': '0',
                    'z-index': this.settings['z-index']
                }),
                    headcolumnSelector = this._columnBuilder(this.settings.left, 'th');
    
                var cTable = $('<table></table>')
                    .addClass($(this.settings.table)[this.useProp ? 'prop' : 'attr']('class'))
                    .css({
                        'width': '1px',
                        'margin-bottom': '0',
                        'table-layout': 'fixed',
                        'background-color': '#fff'
                    })
                    .append(
                    $('<thead></thead>').append(this._cloneCells(this.settings.table.find('tr:first-child '+ headcolumnSelector),
                        this.settings.left))
                    );
                this.grid.cDiv.append(cTable);
            },
            _fixHead: function () {
                this.grid.fhDiv = $('<div>').css({
                    'width': this.settings.containerWidth,
                    'overflow': 'hidden'
                });
                var fhTable = $('<table>')
                    .addClass($(this.settings.table)[this.useProp ? 'prop' : 'attr']('class'))
                    .css({
                        'width': this.settings.table[0].clientWidth != 0 ? this.settings.table[0].clientWidth : this.settings.table[0].style.width,
                        'max-width': this.settings.table[0].clientWidth != 0 ? this.settings.table[0].clientWidth : this.settings.table[0].style.maxWidth,
                        'margin-bottom': '0'
                    })
                    .append(this.settings.table.find('thead').clone(true));
                this.grid.fhDiv.append(fhTable);
                this.settings.table.find('thead').hide();
            },
            _fixLeft: function () {
                var fbDiv = $('<div></div>').css({
                    'position': 'absolute',
                    'top': this.grid.headerHeight + 1,
                    'left': '0',
                    'z-index': this.settings['z-index'],
                    'overflow-y': 'hidden',
                    'height': this.settings.table.parent()[0].clientHeight
                }),
                    bodycolumnSelector = this._columnBuilder(this.settings.left, 'td');
    
                var ftable = $('<table>').addClass($(this.settings.table)[this.useProp ? 'prop' : 'attr']('class')).css({
                    'width': '1px',
                    'table-layout': 'fixed',
                    'background-color': '#fff',
                    'border-collapse': 'separate'
                })
                    .append(
                    $('<tbody>').append(this._cloneCells(this.settings.table.find(bodycolumnSelector),
                        this.settings.left))
                    );
    
                fbDiv.append(ftable);
                return fbDiv;
            },
            _scrollGrid: function () {
                var _this = this;
    
                this.grid.sbDiv.bind('scroll', function (e) {
                    _this.grid.fbDiv.scrollTop(this.scrollTop);
                    _this.grid.fhDiv.scrollLeft(this.scrollLeft);
                });
    
                this.grid.fbDiv.bind('mousewheel DOMMouseScroll', function (e) {
                    var st = _this.grid.sbDiv.scrollTop();
                    if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
                        //up
                        _this.grid.sbDiv.scrollTop(st - 25);
                    } else {
                        //down
                        _this.grid.sbDiv.scrollTop(st + 25);
                    }
                    e.preventDefault();
                });
            },
            _setHeights: function () {
                var _this = this;
                setTimeout(function () {
                    var hh = _this.grid.fhDiv[0].clientHeight,
                        bh = _this.settings.table.parent()[0].clientHeight;
                    _this.grid.cDiv.find('tr:first-child').css('height', hh - 1);
                    _this.grid.fbDiv.css({ 'top': hh, 'height': bh - 1 });
                    _this.settings.table.find('tbody tr').each(function (i, row) {
                        _this.grid.fbDiv.find('table tbody tr:nth-child(' + (i + 1) + ')').css('height', row.clientHeight)
                    })
                }, 5);
            },
            _setup: function () {
                this.grid.sbDiv = this._wrapActuals();
                this._setCorner();
                if (this.settings.head) {
                    this._fixHead();
                }
                if (this.settings.left > 0) {
                    this.grid.fbDiv = this._fixLeft();
                }
                this._setParent();
                this.settings.table.parent()
                    .before(this.grid.cDiv)
                    .before(this.grid.fhDiv)
                    .before(this.grid.fbDiv);
                this._scrollGrid();
                this._setHeights();
                this._setDataChangeListener();
                this._propagateInputChangesFromFixedTable();
            },
            _reset: function () {
                this.grid.cDiv.remove();
                this.grid.fhDiv.remove();
                this.grid.fbDiv.remove();
                this.settings.table.unwrap();
                this.settings.table.find('thead').show();
            },
            refresh: function () {
                //rebind the modified table with dataGrid
                this._reset();
                this._setup();
            },
            destroy: function () {
                // destroy dataGrid
                $(this.settings.parent).removeAttr('style');
                this._reset();
                this.settings.table.find('tbody tr').off('dataChange');
                delete this.settings.table.data().dataGrid;
            }
        }
    
        var dataGridPlugin = function (params) {
            var internal_return;
            this.each(function () {
                var data = $(this).data('dataGrid');
                if (!data) {
                    var opts = typeof params === 'object' && params;
                    data = new DataGrid(this, opts);
                    $(this).data('dataGrid', data);
                }
    
                if (typeof params === 'string' && typeof data[params] === 'function') {
                    if (params.split('_').length === 1)
                        internal_return = data[params].call(data);
                    else
                        throw Error("'" + params + "' " + "is a private function.");
                }
    
                if (internal_return === undefined || internal_return instanceof DataGrid) {
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
                        cspan = $cell[this.useProp ? 'prop' : 'attr']("colspan") | 0,
                        rspan = $cell[this.useProp ? 'prop' : 'attr']("rowspan") | 0,
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
    
    (function (old) {
        $.fn.attr = function () {
            if (arguments.length === 0) {
                if (this.length === 0) {
                    return null;
                }
    
                var obj = {};
                $.each(this[0].attributes, function () {
                    if (this.specified) {
                        obj[this.name] = this.value;
                    }
                });
                return obj;
            }
            return old.apply(this, arguments);
        };
    })($.fn.attr);