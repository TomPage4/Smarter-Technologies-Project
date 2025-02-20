document.addEventListener("DOMContentLoaded", function() {

    const link = document.getElementById("link");
    link.href = "/dashboard"
    link.textContent = "Dashboard";

    const urlData = new URLSearchParams(window.location.search);
    const encodedNavPath = urlData.get('data');
    
    const navPath = JSON.parse(decodeURIComponent(encodedNavPath));
    console.log(navPath);
    
    // This is the global variable taken from the html file, taken from the flask return.. it was the only way :(
    const subcats = window.subcats;
    console.log("Subcategories:", subcats);
    
    const tbody = document.querySelector("tbody");
    const table = document.getElementById("table_container");
    const submit = document.createElement("button")

    const title = document.getElementById("heading");
    // https://www.geeksforgeeks.org/how-to-add-spaces-between-words-starting-with-capital-letters-using-regex-in-javascript/
    // REGEX for adding space before capital letter
    title.textContent = navPath[navPath.length - 1].replace(/([A-Z])/g, " $1").trim();;

    subcats.forEach((element, index) => {
        
        const newtr = document.createElement("tr");
        const attrName = document.createElement("td");
        attrName.className = "equal-width";
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
        // for replace
        attrName.textContent = element[0].replace(/`/g, "");
        const attrProp = document.createElement("td");
        attrProp.className = "equal-width";

        // because they arent actually bools in the sample data - need to check if it was assigned either true or false
        if (element[1] == "TRUE" || element[1] == "FALSE") {
            const input = document.createElement("input");
            input.type = "checkbox";
            input.className = "btn-check col-lg-6 col-sm-12 mx-auto";
            input.id = "btncheck" + index;
            input.autocomplete = "off";
            input.style.width = "100%";
            
            if (element[1] == "TRUE") {
                input.checked = true;
            }
            // https://getbootstrap.com/docs/5.3/components/button-group/#checkbox-and-radio-button-groups
            // For the label and checkbox combo
            const label = document.createElement("label");
            label.className = "btn btn-outline-primary";
            label.setAttribute("for", input.id);
            label.textContent = element[1];
            label.style.width = "100%";

            // putting it in a wrapper to control the size
            const inputWrapper = document.createElement("div");
            inputWrapper.className = "col-lg-6 col-sm-12 mx-auto";
            inputWrapper.appendChild(input);
            inputWrapper.appendChild(label);

            // if it's changed then see the checked status, change label accordingly
            input.addEventListener("change", function() {
                if (input.checked) {
                    label.className = "btn btn-outline-danger";
                    label.textContent = "TRUE";
                    element[1] = "TRUE";
                } else {
                    label.className = "btn btn-outline-danger";
                    label.textContent = "FALSE";
                    element[1] = "FALSE";
                }
                console.log(subcats);
            });
            
            attrProp.appendChild(inputWrapper);
        }
        else if (element[2] == "TEXT") {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "form-control";
            input.value = element[1];
            input.style.textAlign = "center";

            const inputWrapper = document.createElement("div");
            inputWrapper.className = "col-lg-6 col-sm-12 mx-auto";
            inputWrapper.appendChild(input);

            attrProp.appendChild(inputWrapper);

            input.addEventListener("change", function() {
                input.className = "form-control border-danger";
                element[1] = input.value;
                console.log(subcats);
            });
        }
        else if (element[2] == "INTEGER") {
            const input = document.createElement("input");
            input.type = "number";
            input.className = "form-control";
            input.value = element[1];
            input.style.textAlign = "center";
            
            const inputWrapper = document.createElement("div");
            inputWrapper.className = "col-lg-6 col-sm-12 mx-auto";
            inputWrapper.appendChild(input);

            attrProp.appendChild(inputWrapper);

            input.addEventListener("change", function() {
                input.className = "form-control border-danger";
                element[1] = input.value;
                console.log(subcats);
            });
        }
        else if (element[2] == "REAL") {
            const input = document.createElement("input");
            input.type = "number";
            input.step = 0.1;
            input.className = "form-control";
            input.value = element[1];
            input.style.textAlign = "center";
            
            const inputWrapper = document.createElement("div");
            inputWrapper.className = "col-lg-6 col-sm-12 mx-auto";
            inputWrapper.appendChild(input);

            attrProp.appendChild(inputWrapper);

            input.addEventListener("change", function() {
                input.className = "form-control border-danger";
                element[1] = input.value;
                console.log(subcats);
            });
        }

        // parenting stuff
        newtr.appendChild(attrName);
        newtr.appendChild(attrProp);
        tbody.appendChild(newtr);
    });

    submit.className = "btn btn-primary col-3 rounded-4";
    submit.type = "submit";
    submit.textContent = "Submit";
    table.appendChild(submit);

    const customerID = window.customerID

    const submitForm = async () => {
        console.log("SUBMIT FORMM");
        console.log({ subcats, customerID });

        try {
            const response = await fetch("/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subcats, customerID }),
            });
    
            if (response.ok) {
                const result = await response.json();
                console.log("Success:", result);
                window.location.href = "/home";
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Hmm that shouldnt have happened");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Server error :( try again later");
        }
    };

    submit.addEventListener("click", submitForm);
    deleteButton.addEventListener("click", deleteCustomer);
});