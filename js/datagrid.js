/*
    The repo can be found at https://github.com/KiranMantha/jquery-fixed-columns-dataGrid

    example:
    //Binding DataGrid
    $('#example').dataGrid({
        left: 2,
        head: true,
        containerId: id-attribute-of-the-target-table-parent,
        containerHeight: in-px || in-vh || in-percentage,
        multiRowSelect: true,
        contextMenuItems: [{
            'text': 'Copy',
            'iconTemplate': '<i class="fa fa-clone"></i>',
            'action': function (selectedRows) { }
        },{
            'text': 'Paste',
            'iconTemplate': '<i class="fa fa-clipboard"></i>',
            'action': function (selectedRows) { }
        }]
    });

    // Destroying DataGrid
    $('#example').dataGrid('destroy');

    // Refresh DataGrid on adding new rows
    $('#example').dataGrid('refresh');

    // Reload DataGrid headers on adding new columns
    $('#example').dataGrid('reloadHeaders');

    // Scroll to last row in DataGrid
    $('#example').dataGrid('scrollToBottom');

    Context Menu Item Object Structure:
    [{
        'text': '',
        'iconTemplate': '',
        'action': function(selectedRows){}
    }]
    http://jsfiddle.net/Brv6J/1972/
    // Sortable Rows
    http://jsfiddle.net/pmw57/tzYbU/205/
    https://stackoverflow.com/questions/20668560/using-jquery-ui-sortable-to-sort-2-list-at-once
*/
(function ($) {
    
        $('head').append('<style type="text/css">tr.selected, td.selected {background-color: #CCD1D9 !important;} .ctxMenu{display: none;padding: 0;margin: 0;list-style: none;position: absolute;border-radius: 4px;width: 150px;background-color: #fff;z-index: 100;}.ctxMenu li{padding: 5px 20px;border: 1px solid #CCD1D9;border-bottom: 0px;}.ctxMenu li:first-child{border-top-left-radius: 4px;border-top-right-radius: 4px;}.ctxMenu li:last-child{border-bottom: 1px solid #CCD1D9;border-bottom-left-radius: 4px;border-bottom-right-radius: 4px;}</style>');
    
        var defaults = {
            head: true,
            left: 0,
            'z-index': 4,
            multiRowSelect: false,
            sortableRows: false,
            contextMenuItems: [],
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
            this.settings = settings;
            this.grid = {
                sDiv: $(),
                fbDiv: $(),
                fhDiv: $(),
                cDiv: $(),
                headerHeight: 0,
                selectedRows: []
            }
    
            this.fixedColTable = this.fixedCornerTable = this.fixedCells = $();
            this._setup();
        }
    
        DataGrid.prototype = {
            constructor: DataGrid,
            settings: {},
            _setDataChangeListener: function () {
                var _this = this;
                if (this.settings.left > 0) {                
                    this.settings.table.find('tbody tr').each(function (i, row) {
                        $(row).on('dataChange', function () {
                            _this.grid.fbDiv.find('tr:nth-child(' + (i + 1) + ')').data($(this).data());
                        });
    
                        //remove row from fbDiv when original row is removed.
                        $(row).on('remove', function () {
                            var dgrow = $(row).attr('data-dgrow');
                            _this.grid.fbDiv.find('tr[data-dgrow="' + dgrow + '"]').remove();
                        });
    
                        if (_this.settings.multiRowSelect) {
                            $(row).on('contextmenu', function (e) {
                                if (_this.grid.selectedRows.length > 0) {
                                    e.preventDefault();
                                    _this._showCtxMenu(e);
                                }
                            });
                        }
                    });
                    this.grid.fbDiv.find('tr').each(function (i, row) {
                        $(row).on('dataChange', function () {
                            _this.settings.table.find('tbody tr:nth-child(' + (i + 1) + ')').data($(this).data());
                        });
    
                        if (_this.settings.multiRowSelect) {
                            $(row).on('contextmenu', function (e) {
                                if (_this.grid.selectedRows.length > 0) {
                                    e.preventDefault();
                                    _this._showCtxMenu(e);
                                }
                            });
                        }
                    });
                }
            },
            _bindRowDragDrop: function(){
                $( ".dgBody tbody" ).sortable({
                    start: function(event, ui) { 
                        currentIndex = ui.helper.index();
                    },
                    change: function( event, ui ) { 
                        var indexCount = ui.item.parent().find('tr:not(.ui-sortable-helper)');
                        var sortClass = '.'+ui.item.attr('class').split(' ')[0];
                        var parent = $('.dgBody tbody').not(ui.item.parent());
                        if(currentIndex > ui.placeholder.index()){
                            parent.find('tr').eq(indexCount.index(ui.placeholder)).before(parent.find(sortClass));
                        }
                        else
                            parent.find('tr').eq(indexCount.index(ui.placeholder)).after(parent.find(sortClass));
                        currentIndex = ui.placeholder.index();
                    }
                });
                $( ".dgBody tbody" ).disableSelection();
            },
            _showCtxMenu: function (e) {
                $('.ctxMenu').css({ left: e.pageX, top: e.pageY - 5 });
                $('.ctxMenu').show();
            },
            _hideCtxMenu: function () {
                $('.ctxMenu').hide();
            },
            _toggleTag: function (tag) {
                if ($(tag).hasClass('selected')) {
                    $(tag).removeClass('selected');                
                } else {
                    $(tag).addClass('selected');                
                }
            },
            _clearAllRows: function () {
                var _this = this;
                $.each(this.grid.selectedRows, function (i, row) {
                    $(row).removeClass('selected');
                    if (_this.settings.left > 0) {
                        var dgrow = $(row).attr('data-dgrow');
                        _this.grid.fbDiv.find('tr[data-dgrow="' + dgrow + '"]').removeClass('selected');
                        _this.settings.table.find('tr[data-dgrow="' + dgrow + '"]').removeClass('selected');
                    }
                });
                this.grid.selectedRows = [];
                this._hideCtxMenu();
            },
            _bindMultiRowSelect: function (newRow, isFixedBodyRow) {
                var actualTblRows = this.settings.table.find('tbody tr');
                    fixedTblRows = this.grid.fbDiv.find('tr'),
                    _this = this;
                if (!newRow) {
                    actualTblRows.each(function (i, row) {
                        $(row).on('mousedown', function () {
                            if (window.event.shiftKey) {
                                _this._toggleTag(row);
                                _this.grid.selectedRows.push(row);
                                if (fixedTblRows.length > 0)
                                    _this._toggleTag($(fixedTblRows).eq(i));
                            }
                            if (window.event.button === 0) {
                                if (!window.event.ctrlKey && !window.event.shiftKey) {
                                    _this._clearAllRows();
                                }
                            }
                        });
                    });
                    fixedTblRows.each(function (i, row) {
                        $(row).on('mousedown', function () {
                            if (window.event.shiftKey) {
                                _this._toggleTag(row);
                                _this.grid.selectedRows.push($(actualTblRows).eq(i));
                                _this._toggleTag($(actualTblRows).eq(i));
                            }
                            if (window.event.button === 0) {
                                if (!window.event.ctrlKey && !window.event.shiftKey) {
                                    _this._clearAllRows();
                                }
                            }
                        });
                    });
                } else {
                    if (!isFixedBodyRow) {
                        $(newRow).on('mousedown', function () {
                            var dgrow = $(this).attr('data-dgrow');
                            if (window.event.shiftKey) {
                                _this._toggleTag(this);
                                _this.grid.selectedRows.push(this);
                                _this._toggleTag(_this.grid.fbDiv.find('tr[data-dgrow="' + dgrow + '"]'));
                            }
                            if (window.event.button === 0) {
                                if (!window.event.ctrlKey && !window.event.shiftKey) {
                                    _this._clearAllRows();
                                }
                            }
                        });
                    } else {
                        $(newRow).on('mousedown', function () {
                            var dgrow = $(this).attr('data-dgrow');
                            if (window.event.shiftKey) {
                                _this._toggleTag(this);
                                var k = _this.settings.table.find('tr[data-dgrow="' + dgrow + '"]')
                                _this.grid.selectedRows.push(k);
                                _this._toggleTag(k);
                            }
                            if (window.event.button === 0) {
                                if (!window.event.ctrlKey && !window.event.shiftKey) {
                                    _this._clearAllRows();
                                }
                            }
                        });
                    }
                }
            },
            _attachContextMenuToBody: function () {            
                var ctxMenu = $('<ul>')
                    .addClass('ctxMenu'),
                    _this = this;
                if (this.settings.contextMenuItems.length > 0) {
                    $.each(this.settings.contextMenuItems, function (i, item) {
                        ctxMenu.append(
                            $('<li>').append($('<a>').html(item['iconTemplate'] + item['text']).on('click', function () {
                                if (typeof item['action'] === "function") {
                                    item['action'](_this.grid.selectedRows);
                                    _this._clearAllRows();
                                }
                            }))
                        );
                    });
                }            
                $('body').append(ctxMenu);
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
                    var td = $cells[i],
                        ctd = $(td).clone(true);
                    cells.push(ctd);
    
                    // Retain select tag values
                    if (ctd.find('select').length > 0) {
                        $(ctd.find('select')[0]).val($($(td).find('select')[0]).val());
                    }
    
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
                        var len = p[0].rowIndex;
                        p.attr('data-dgrow', len);
                        row.attr('data-dgrow', len);
                        if (rows.length == maxRows) {
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
                    $('<thead></thead>').append(this._cloneCells(this.settings.table.find('tr:first-child ' + headcolumnSelector),
                        this.settings.left, 1))
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
                fhTable.children('thead').show();
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
                if (this.settings.multiRowSelect) {
                    this._bindMultiRowSelect();
                    this._attachContextMenuToBody();
                }
                if(this.settings.sortableRows) {
                    this.settings.table.addClass('dgBody');
                    this.grid.fbDiv.find('table').addClass('dgBody');
                    this._bindRowDragDrop();
                }
            },
            _reset: function () {
                this.grid.cDiv.remove();
                this.grid.fhDiv.remove();
                this.grid.fbDiv.remove();
                this.settings.table.unwrap();
                this.settings.table.removeClass('dgBody');
                this.settings.table.find('thead').show();
            },
            refresh: function () {
                if (this.settings.left > 0) {
                    var actualTblRowCount = this.settings.table.find('tbody tr').length,
                        fixedTblRowCount = this.grid.fbDiv.find('table > tbody tr').length,
                        rows = $(),
                        _this = this;
                    if (actualTblRowCount > fixedTblRowCount) {
                        rows = this.settings.table.find('tbody tr:nth-child(' + fixedTblRowCount + ')').nextAll();
                        var bodycolumnSelector = this._columnBuilder(this.settings.left, 'td');
                        rows.each(function (index, row) {                        
                            _this.grid.fbDiv.find('table > tbody').append(_this._cloneCells($(row).find(bodycolumnSelector),
                                _this.settings.left));
                            _this._bindMultiRowSelect(row);
                            _this._bindMultiRowSelect(_this.grid.fbDiv.find('table > tbody > tr:last-child'), true);
                        });
                    }
                    this._propagateInputChangesFromFixedTable();
                    this._setDataChangeListener();                
                }
            },
            reloadHeaders: function () {            
                this.grid.cDiv.remove();
                this.grid.fhDiv.remove();
                this._setCorner();
                if (this.settings.head) {
                    this._fixHead();
                }
                this.settings.table.parent()
                    .before(this.grid.cDiv)
                    .before(this.grid.fhDiv);
                this.grid.cDiv.children('table').find('tr:first-child').css('height', this.grid.fhDiv[0].clientHeight - 1);
                if (this.settings.left > 0) {
                    this.grid.fbDiv.css({ 'top': this.grid.fhDiv[0].clientHeight + 'px', 'height': this.settings.table.parent()[0].clientHeight - 1 });
                }
            },
            destroy: function () {
                // destroy dataGrid
                $(this.settings.parent).removeAttr('style');
                this._reset();
                this.settings.table.find('tbody tr').off('dataChange');
                delete this.settings.table.data().dataGrid;
            },
            scrollToBottom: function () {
                var scrollHeight = this.grid.sbDiv[0].scrollHeight;
                this.grid.sbDiv.scrollTop(scrollHeight);
                this.grid.fbDiv.scrollTop(scrollHeight);
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