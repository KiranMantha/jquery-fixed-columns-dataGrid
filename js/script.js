$(document).ready(function(){
    bindGrid();
    $('#destroy').on('click', function() {
        $('#example').dataGrid('destroy');
    });
    
    $('#bind').on('click', function() {
        bindGrid();
    });

    $('.checkall').on('change', function(e) {
        $(e.currentTarget).closest('tr').data('checked', e.currentTarget.checked).trigger('dataChange');
    });
});

function checkall(e) {
    $('.checkall').prop('checked', $(e)[0].checked);
}

function bindGrid() {
    $('#example').dataGrid({
        left: 3,
        containerId: 'tblContainer',
        containerHeight: '450px',
        containerWidth: '500px',
        sortableRows: true,
        multiRowSelect: true,
        contextMenuItems: [{
            'text': 'Copy',
            'iconTemplate': '<i class="fa fa-clone"></i>',
            'action': function (selectedRows) {
                console.log('selected rows\n');
                console.log(selectedRows);
            }
        }, {
            'text': 'Paste',
            'iconTemplate': '<i class="fa fa-clipboard"></i>',
            'action': function (selectedRows) {
                console.log('selected rows\n');
                console.log(selectedRows);
            }
        }]
    });
}
