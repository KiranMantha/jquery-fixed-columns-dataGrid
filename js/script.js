$(document).ready(function(){
    bindGrid();
    $('#destroy').on('click', function() {
        $('#example').dataGrid('destroy');
    });
    
    $('#bind').on('click', function() {
        bindGrid();
    });
});

function bindGrid() {
    $('#example').dataGrid({
        left: 2,
        containerId: 'tblContainer',
        containerHeight: '500px',
        containerWidth: '500px'
    }); 
}