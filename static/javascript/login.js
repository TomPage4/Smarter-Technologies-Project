document.addEventListener("DOMContentLoaded", function() {

    const link = document.getElementById("link");
    const redir = document.getElementById("redir");
    link.remove();
    redir.remove();

    const signInButton = document.querySelector(".btn-primary");

    signInButton.addEventListener("click", async function(event) {
        event.preventDefault();

        const username = document.querySelector('input[name="username"]').value;
        const password = document.querySelector('input[name="password"]').value;

        if (username && password) {
            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();
                if (response.ok) {
                    window.location.href = "/dashboard";
                } else {
                    displayError(result.error);
                }
            } catch (error) {
                console.error("Error during login:", error);
                displayError("An unexpected error occurred. Please try again.");
            }
        } else {
            displayError("Both fields are required.");
        }
    });

    function displayError(message) {
        const errorContainer = document.querySelector("#error-message");
        if (errorContainer) {
            errorContainer.textContent = message;
        } else {
            const errorParagraph = document.createElement("p");
            errorParagraph.textContent = message;
            errorParagraph.style.color = "red";
            errorParagraph.id = "error-message";
            document.querySelector(".right-box").appendChild(errorParagraph);
        }
    }
});
