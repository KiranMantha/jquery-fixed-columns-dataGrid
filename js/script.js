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
        containerHeight: '500px',
        containerWidth: '500px'
    });
}