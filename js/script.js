$(document).ready(function(){
    $('#example').dataGrid({
        left: 2,
        containerId: 'tblContainer',
        containerHeight: '500px',
        containerWidth: '500px'
    });

    $('#destroy').on('click', function() {
        $('#example').dataGrid('destroy');
    });
});