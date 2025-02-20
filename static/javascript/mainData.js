document.addEventListener('DOMContentLoaded', () =>{

    const link = document.getElementById("link");
    link.href = "/dashboard"
    link.textContent = "Dashboard";

    // Variable to keep track of where user is in data tree
    let navPath = ['home'];
    // Declaring the array of names that will cause the user to be redirected
    const breakoutPrefix = ['features', 'mobile', 'standard', 'genericSettings', 'bb5', 'bb6', 'beamSensor', 'gps', 'pressurePad', 'reedSwitch', 'solarCamera', 'ultrasonic', 'vibration', 'weather'];
    // Fetching client names
    fetch('/client-names')
        .then(response => response.json())
        .then(client => {
            clientNames = client;
            // Print page
            printNames(clientNames);
            // Calls initial creation of search bar
            placeSearchBar();
            // Calls initial creation of backup button
            placeBackupButton();
        })

    // Function to print page
    function printNames(allCustomers) {
        if (allCustomers === undefined) {
            fetch('/client-names')
                .then(response => response.json())
                .then(allCustomers => {
                    const customerData = document.getElementById('customer-data');
                    // Clears previous page content
                    customerData.innerHTML = '';
                    // Loops through each client in the array
                    allCustomers.forEach(([id, name, date]) => {
                        const navFile = document.createElement('li');
                        navFile.classList.add('nav-file');
                        // Creating image element
                        const fileImage = document.createElement('img');
                        fileImage.src = '/static/images/file-image.png';
                        fileImage.alt = 'File image';
                        fileImage.classList.add('file-image');
                        // Creating file element
                        const fileText = document.createElement('span');
                        // Assiging the name to file
                        fileText.textContent = name
                        // Adding image and text to file element
                        navFile.appendChild(fileImage)
                        navFile.appendChild(fileText)
                        // Redirects user when file is clicked
                        navFile.addEventListener('click', (e) => {
                            const clickedText = e.target.nextSibling.innerText;
                            navPath.push(clickedText);
                            fetchData(id);
                        });
                        customerData.appendChild(navFile)
                    });
                    displayedNavPath(navPath);
                    displayedSortOptions(navPath.length);
                });
            }
        else {
            const customerData = document.getElementById('customer-data');
            // Clears previous page content
            customerData.innerHTML = '';
            // Loops through each client in the array
            allCustomers.forEach(([id, name, date]) => {
                const navFile = document.createElement('li');
                navFile.classList.add('nav-file');
                // Creating image element
                const fileImage = document.createElement('img');
                fileImage.src = '/static/images/file-image.png';
                fileImage.alt = 'File image';
                fileImage.classList.add('file-image');
                // Creating file element
                const fileText = document.createElement('span');
                // Assiging the name to file
                fileText.textContent = name
                // Adding image and text to file element
                navFile.appendChild(fileImage)
                navFile.appendChild(fileText)
                // Redirects user when file is clicked
                navFile.addEventListener('click', (e) => {
                    const clickedText = e.target.nextSibling.innerText;
                    navPath.push(clickedText);
                    fetchData(id);
                });
                customerData.appendChild(navFile)
            });
            displayedNavPath(navPath);
            displayedSortOptions(navPath.length);
        }
    }

    // Fetching data for page
    function fetchData(customerID) {
        fetch(`/client-data/${customerID}`)
            .then(response => response.json())
            .then(data => {
                clientInfo = data;
                // To remove 'customerID' from start of data array
                clientInfo.shift()
                // Print page
                printNewPage(clientInfo, undefined);
            })
    }

    // Function to print a new page of files
    function printNewPage(data, prefix) {
        const customerData = document.getElementById('customer-data');
        // Clearing previous data
        if (breakoutPrefix.includes(prefix) === false) {
            customerData.innerHTML = '';
        }
        // Declaring variable to keep track of previous titles
        const seenTitle = new Set()
        // To avoid errors
        if (navPath.length === 2) {
            prefix = undefined
        }
        // Looping through each element in the data array
        for (let i = 0; i < data.length; i++) {
            const titleElement = data[i];
            const title = titleElement.split('.')[navPath.length - 2];

            // Deals with redirecting the user if they are near the end of titles elements or matching an element from the breakoutPrefix array
            if (breakoutPrefix.includes(prefix) === true) {
                let sentNavPath = encodeURIComponent(JSON.stringify(navPath));
                window.location.href = `/edit-data?data=${sentNavPath}`;
                navPath.pop();
                break;
            }
            else if (!seenTitle.has(title) && titleElement.split('.')[navPath.length - 3] === prefix && titleElement.split('.')[navPath.length - 1] != undefined) {
                // Keeps track of previous titles
                seenTitle.add(title);
                // Creating file element
                const navFile = document.createElement('li');
                navFile.classList.add('nav-file');

                // Creating image element
                const fileImage = document.createElement('img');
                fileImage.src = '/static/images/file-image.png';
                fileImage.alt = 'File image';
                fileImage.classList.add('file-image');

                // Loops through data
                for (let dataElement of data) {
                    // Splits each element of data by '.'
                    const dataElementPart = dataElement.split('.');
                    // Finds index of title in dataElementPart
                    const titleIndex = dataElementPart.indexOf(title);
                    // Checks if the end of the title is 'icon' and that the selected title is 2 away from the end
                    if (titleIndex != -1 && dataElementPart[titleIndex + 2] === 'icon' && dataElementPart[0] === navPath[2] && dataElementPart[1] === title) {
                        let customerID = clientNames.find(clientName => clientName[1] === navPath[1]);
                        customerID = customerID[0];
                        // Sending request to database
                        fetch(`/get-icon?customer-id=${customerID}&title=${dataElement}`)
                            // Awaits data base connection
                            .then(response => response.json())
                            // Then carries out the following
                            .then(dataResponse => {
                                // Fixing returned data formatting
                                let iconName = dataResponse[0][0];
                                // Replaces ':' with '-' as that is what the image is called
                                iconName = iconName.replace(':', '-');
                                // Updates the image to the one received from the database
                                fileImage.src = `/static/images/${iconName}.svg`;
                            });
                        break;
                    }
                };

                // Creating text element
                const fileText = document.createElement('span');
                fileText.textContent = title;
                fileText.classList.add('file-text');
                // Adding image and text to file element
                navFile.appendChild(fileImage);
                navFile.appendChild(fileText);
                // Adding the file element to the grid
                customerData.appendChild(navFile);
                // Code to be executed if file is clicked
                navFile.addEventListener('click', (e) => {
                    const clickedText = e.target.nextSibling.innerText;
                    // To keep track of the navigation path
                    navPath.push(clickedText);
                    // Calling function to output new page
                    printNewPage(data, clickedText);
                });
            }
        }
        if (breakoutPrefix.includes(prefix) === false) {
            displayedNavPath(navPath);
            displayedSortOptions(navPath.length, seenTitle);
            placeSearchBar();
            placeBackupButton();
            placeDeleteUserButton();
        }
    }

    // Function to display sort options depending on the page
    function displayedSortOptions(pageNumber) {
        // Connecting to correct element through ID
        const sortByContainer = document.getElementById('sort-by-options');
        // Clearing previous
        sortByContainer.innerHTML = '';
        // Creating a-z sort option
        const azLi = document.createElement('li');
        const az = document.createElement('a');
        az.textContent = 'Name (A-Z)';
        az.id = 'a-z';
        azLi.appendChild(az);
        sortByContainer.appendChild(azLi);
        // Creating z-a sort option
        const zaLi = document.createElement('li');
        const za = document.createElement('a');
        za.textContent = 'Name (Z-A)';
        za.id = 'z-a'
        zaLi.appendChild(za);
        sortByContainer.appendChild(zaLi);
        // Should only output sort by date if the user is selecting the client
        if (pageNumber === 1) {
            // Creating new-old sort option
            const newOldLi = document.createElement('li');
            const newOld = document.createElement('a');
            newOld.textContent = 'Date added (Newest - oldest)';
            newOld.id = 'new-old'
            newOldLi.appendChild(newOld);
            sortByContainer.appendChild(newOldLi);
            // Creating old-new sort option
            const oldNewLi = document.createElement('li');
            const oldNew = document.createElement('a');
            oldNew.textContent = 'Date added (Olded - newest)';
            oldNew.id = 'old-new'
            oldNewLi.appendChild(oldNew);
            sortByContainer.appendChild(oldNewLi);
        }
        // Fetching dropdown elements
        const listItems = sortByContainer.querySelectorAll('a')
        // Looping through fetched dropdown options and assigning them class names
        listItems.forEach(item => {
            item.classList.add('dropdown-item');
            item.classList.add('sort-by')
        });
    }

    // Sorting code
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('sort-by')) {
            e.preventDefault();
            // Fetching chosen sort option
            const sortOption = e.target.id;
            // Declaring sortedClientData
            let sortedClientNames;
            let sortedClientInfo = [];
            // Deals with sorting if user is selecting a client
            if (navPath.length === 1) {
                // Checking which option was selected and sorting accordingly
                // Sorting A-Z
                if (sortOption === 'a-z') {
                    sortedClientNames = clientNames.sort((a, b) => a[1].localeCompare(b[1]));
                }
                // Sorting Z-A
                else if (sortOption === 'z-a') {
                    sortedClientNames = clientNames.sort((a, b) => b[1].localeCompare(a[1]));
                }
                // Sorting New-Old
                else if (sortOption === 'new-old') {
                    sortedClientNames = clientNames.sort((a, b) => new Date(a[2]) - new Date(b[2]));
                }
                // Sorting Old-New
                else if (sortOption === 'old-new') {
                    sortedClientNames = clientNames.sort((a, b) => new Date(b[2]) - new Date(a[2]));
                }
                // Print page
                printNames(sortedClientNames);
            }
            // Sorting on any other page
            else {
                sortedClientInfo = clientInfo.slice().sort((a, b) => {
                    // Splitting each database collumn header into an array
                    a.split('.');
                    b.split('.');
                    // Declaring index to be compared
                    const index = navPath.length - 2;
                    // Comparing partA and partB
                    return a[index].localeCompare(b[index])
                });
                if (sortOption === 'a-z') {

                }
                else if (sortOption === 'z-a') {
                    sortedClientInfo.reverse()
                }
                printNewPage(sortedClientInfo, navPath[navPath.length - 1])
            }
        }
    });

    // Ajust file size
    document.querySelectorAll('.file-size').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const fileSize = e.target.id;
            const root = document.documentElement;
            // Checking which option was selected and changing variables accordingly
            if (fileSize === 'small') {
                root.style.setProperty('--st-grid-size', '80px')
                root.style.setProperty('--st-grid-text-size', '15px')
                root.style.setProperty('--st-grid-gap-size', '30px')
            }
            else if (fileSize === 'medium') {
                root.style.setProperty('--st-grid-size', '120px')
                root.style.setProperty('--st-grid-text-size', '20px')
                root.style.setProperty('--st-grid-gap-size', '40px')
            }
            else if (fileSize === 'large') {
                root.style.setProperty('--st-grid-size', '160px')
                root.style.setProperty('--st-grid-text-size', '30px')
                root.style.setProperty('--st-grid-gap-size', '50px')
            }
        });
    });

    // Navigation path
    function displayedNavPath(importNavPath) {
        const navPathContainer = document.getElementById('displayed-nav-bar');
        navPathContainer.innerHTML = '';
        const navPathText = document.createElement('span');
        importNavPath.forEach((navPathElement) => {
            const individualNavPathText = document.createElement('a');
            individualNavPathText.textContent = ' / ' + navPathElement;
            individualNavPathText.classList.add('nav-path-element');
            navPathText.appendChild(individualNavPathText);
        });
        navPathContainer.appendChild(navPathText);
    }

    // Displayed nav bar
    document.getElementById('displayed-nav-bar').addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-path-element')) {
            e.preventDefault();
            // Using regular expression to remove the " /"
            const navPathElement = e.target.textContent.replace(/[\s|\/]+/, '');
            navPath = navPath.slice(0, navPath.indexOf(navPathElement) + 1);
            if (navPathElement === 'home') {
                printNames(clientNames);
                placeSearchBar();
                placeBackupButton();
                placeDeleteUserButton();
            }
            else {
                printNewPage(clientInfo, navPathElement);
            }
        }
    });

    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        // Dealing with if user presses back while selecting a client
        if (navPath.length === 1) {
            printNames(clientNames)
        }
        else if (navPath.length === 2) {
            navPath.pop();
            displayedNavPath(navPath);
            printNames(clientNames);
            placeSearchBar();
            placeBackupButton();
            placeDeleteUserButton();
        }
        else {
            navPath.pop();
            printNewPage(clientInfo, navPath[navPath.length - 1]);
        }
    });

    // Placing search bar on client name page
    function placeSearchBar() {
        const searchBar = document.getElementById('search-form');
        searchBar.innerHTML = '';
        if (navPath.length === 1) {
            // Search input
            const searchInput = document.createElement('input');
            searchInput.classList.add('form-control', 'mr-sm-2');
            searchInput.id = 'search-box';
            searchInput.type = 'search';
            searchInput.placeholder = 'Search clients';
            // Adding search button and input to element
            searchBar.appendChild(searchInput);
        }
    }

    // Event listener for input into search bar
    document.getElementById('search-form').addEventListener('input', (e) => {
        searchedTitle = e.target.value;
        const filteredClientNames = clientNames.filter(clientName => {
            return clientName[1].toLowerCase().includes(searchedTitle.toLowerCase());
        });
        printNames(filteredClientNames);
    });
    // Preventing search button
    document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
    });

    // Placing backup or export button
    function placeBackupButton() {
        // If on page one, display "Create backup"
        if (navPath.length === 1) {
            const backupButton = document.getElementById('backup-export');
            backupButton.innerHTML = '';

            backupButtonElement = document.createElement('button');
            backupButtonElement.classList.add('btn', 'btn-secondary');
            backupButtonElement.id = 'backup-button';
            backupButtonElement.type = 'button';
            backupButtonElement.textContent = 'Create backup';

            backupButton.appendChild(backupButtonElement);
        }
        // If on any other page, display "Export user data configuration"
        else {
            const exportButton = document.getElementById('backup-export');
            exportButton.innerHTML = '';

            exportButtonElement = document.createElement('button');
            exportButtonElement.classList.add('btn', 'btn-secondary');
            exportButtonElement.id = 'backup-button';
            exportButtonElement.type = 'button';
            exportButtonElement.textContent = 'Export user data configuration';

            exportButton.appendChild(exportButtonElement);
        }
    }

    // Event listener for backup/export button
    document.getElementById('backup-export').addEventListener('click' , () => {
        // If on page one, call backup function
        if (navPath.length === 1) {
            window.location.href = '/backup';
        }
        // If on any other page, call export function passing in id data
        else {
            let id = clientNames.find(clientName => clientName[1] === navPath[1])
            id = id[0]
            let exportedID = encodeURIComponent(JSON.stringify(id));
            window.location.href = `/export?data=${exportedID}`;
        }
    })

    // Placing delete user button
    function placeDeleteUserButton() {
        // If on page one, display nothing
        if (navPath.length === 1) {
            const backupButton = document.getElementById('delete-user');
            backupButton.innerHTML = '';
        }
        // If on any other page, display delete user button
        else {
            const deleteUserButton = document.getElementById('delete-user');
            deleteUserButton.innerHTML = '';

            deleteUserButtonElement = document.createElement('button');
            deleteUserButtonElement.classList.add('btn', 'btn-secondary');
            deleteUserButtonElement.id = 'delete-user-button';
            deleteUserButtonElement.type = 'button';
            deleteUserButtonElement.textContent = 'Delete user';

            deleteUserButton.appendChild(deleteUserButtonElement);
        }
    }

    // Event listener for delete user button
    document.getElementById('delete-user').addEventListener('click' , () => {
        const confirmation = confirm(`Are you sure you want to permanently delete ${navPath[1]} from the database?`);
        if (confirmation) {
            let id = clientNames.find(clientName => clientName[1] === navPath[1])
            let exportedID = id[0]
            fetch(`/delete-user?exportedID=${exportedID}&name=${navPath[1]}`)
                .then(response => {
                    if (response.status === 200) {
                        navPath = [navPath[0]]
                        printNames();
                        placeSearchBar();
                        placeBackupButton();
                        placeDeleteUserButton();
                        alert('User successfully deleted');
                    }
                    else if (response.status === 500) {
                        alert(response.statusText);
                    }
                });
        }
    })
});