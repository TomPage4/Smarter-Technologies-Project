document.addEventListener('DOMContentLoaded', () => {
    const addClientForm = document.getElementById('addClientForm');

    const link = document.getElementById("link");
    link.href = "/dashboard"
    link.textContent = "Dashboard";

    addClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientName = document.getElementById('clientName').value;
        const longitude = document.getElementById('longitude').value;
        const latitude = document.getElementById('latitude').value;

        const clientData = {
            name: clientName,
            longitude: longitude,
            latitude: latitude
        };

        try {
            const response = await fetch('/add-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clientData),
            });

            const result = await response.json();

            if (result.success) {
                alert(`Client added successfully! New Client ID: ${result.new_client_id}`);
                window.location.href = '/dashboard'; // Redirect to dashboard
            } else {
                alert(`Failed to add client. Error: ${result.error}`);
            }
        } catch (error) {
            alert(`Error: ${error}`);
        }
    });
});
