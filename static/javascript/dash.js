new DataTable("#changeLog");
new DataTable("#newest_customers");
$(document).ready(function() {
    if ($.fn.dataTable.isDataTable('#changeLog')) {
        $('#changeLog').DataTable().destroy();
    }
    
    $('#changeLog').DataTable({
        "order": [2, "desc"]
    });
});

document.addEventListener('DOMContentLoaded', () =>{
    const link = document.getElementById("link");
    link.href = "/home"
    link.textContent = "Edit Data";
});