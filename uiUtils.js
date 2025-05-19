// js/uiUtils.js
console.log("uiUtils.js loaded");

const loadingIndicator = document.getElementById('loadingIndicator');
const messageArea = document.getElementById('messageArea');
let messageTimeout = null;

function showLoading(isLoading) {
    if (loadingIndicator) {
        loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    } else {
        console.warn("showLoading: loadingIndicator not found");
    }
}

function showMessage(message, type = 'info', duration = 5000) { // Default type 'info', duration 5s
    if (messageArea) {
        messageArea.textContent = message;
        messageArea.className = ''; // Rensa tidigare klasser
        messageArea.classList.add(type);
        messageArea.style.display = message ? 'block' : 'none';

        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        if (message && duration > 0) {
            messageTimeout = setTimeout(() => {
                messageArea.style.display = 'none';
                messageArea.textContent = '';
                messageArea.className = '';
            }, duration);
        }
    } else {
        console.warn("showMessage: messageArea not found");
    }
}

function setActiveNavLink(viewId) { // viewId kan vara 'dashboard', 'projects', 'musicians'
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        if (link.id === `nav-${viewId}`) {
            link.classList.add('active');
        }
    });
}

function populateDropdown(selectElementId, optionsArray, defaultOptionText = "Välj...", selectedValue = null) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        console.error(`populateDropdown: Element with ID '${selectElementId}' not found!`);
        return;
    }
    selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
    if (optionsArray && optionsArray.length > 0) {
        optionsArray.forEach(option => {
            if (typeof option.id !== 'undefined' && typeof option.name !== 'undefined') {
                const optionElement = document.createElement('option');
                optionElement.value = option.id;
                optionElement.textContent = option.name;
                if (selectedValue && option.id === selectedValue) {
                    optionElement.selected = true;
                }
                selectElement.appendChild(optionElement);
            } else {
                console.warn(`populateDropdown: Option for ${selectElementId} is malformed:`, option);
            }
        });
    }
}

function clearForm(formContainerId) {
    const form = document.getElementById(formContainerId);
    if (form) {
        form.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="tel"], textarea').forEach(input => input.value = '');
        form.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
        // Add for checkboxes and radio buttons if needed
    }
}

// Helper to create DOM elements, useful for more complex UI generation
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    for (const key in attributes) {
        if (key === 'textContent') {
            element.textContent = attributes[key];
        } else if (key === 'innerHTML') {
            element.innerHTML = attributes[key];
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, attributes[key]);
        }
        else {
            element.setAttribute(key, attributes[key]);
        }
    }
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    return element;
}