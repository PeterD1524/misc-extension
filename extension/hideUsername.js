"use strict";

Element.prototype.getLowerCaseAttribute = function (qualifiedName) {
    return this.hasAttribute(qualifiedName) ? this.getAttribute(qualifiedName).toLowerCase() : null;
};

Element.prototype.shadowSelectorAll = function (selectors) {
    return this.shadowRoot ? this.shadowRoot.querySelectorAll(selectors) : undefined;
};

const _maximumInputs = 100;

/**
 * Contains already called method names
 */
const _called = {};
_called.automaticRedetectCompleted = false;

/**
 * @Object miscFields
 * Provides methods for input field handling.
 */
const miscFields = {};

/**
 * Returns all username & password combinations detected from the inputs.
 * 
 * After username field is detected, first password field found after that will be saved as a combination.
 * @param {HTMLInputElement[]} inputs 
 */
miscFields.getAllCombinations = function (inputs) {
    const combinations = [];
    let usernameField = null;

    for (const input of inputs) {
        if (!input) {
            continue;
        }

        if (input.type === "password") {
            const combination = {
                username: (!usernameField || usernameField.size < 1) ? null : usernameField,
                password: input,
                passwordInputs: [input],
                form: input.form
            };

            combinations.push(combination);
            usernameField = null;
        } else {
            usernameField = input;
        }
    }

    if (misc.singleInputEnabledForPage && combinations.length === 0 && usernameField) {
        const combination = {
            username: usernameField,
            password: null,
            passwordInputs: [],
            form: usernameField.form
        };

        combinations.push(combination);
    }

    return combinations;
};

/**
 * Return all input fields on the page, but ignore previously detected
 * @param {HTMLInputElement[]} previousInputs 
 */
miscFields.getAllPageInputs = function (previousInputs = []) {
    const fields = [];
    const inputs = miscObserverHelper.getInputs(document.body);

    for (const input of inputs) {
        // Ignore fields that are already detected
        if (previousInputs.includes(input)) {
            continue;
        }

        if (miscFields.isVisible(input) && !miscFields.isSearchField(input) && miscFields.isAutocompleteAppropriate(input)) {
            fields.push(inputs);
        }
    }

    misc.detectedFields = previousInputs.length + fields.length;

    misc.initCombinations(inputs);
    return fields;
};

/**
 * Check for new password via autocomplete attribute
 * @param {HTMLInputElement} field 
 */
miscFields.isAutocompleteAppropriate = function (field) {
    const autocomplete = field.getLowerCaseAttribute("autocomplete");
    return autocomplete !== "new-password";
}

/**
 * Returns true if form is a search form
 * @param {Element} form 
 */
miscFields.isSearchForm = function (form) {
    // Check form action
    const formAction = form.getLowerCaseAttribute("action");
    if (formAction && (formAction.includes("search") && !formAction.includes("research"))) {
        return true;
    }

    // Ignore form with search classes
    const formId = form.getLowerCaseAttribute("id");
    // ??? form.className.includes("research")
    if (form.className && (form.className.includes("search") || (formId && formId.includes("search") && !formId.includes("research")))) {
        return true;
    }

    return false;
};

/**
 * Checks if input field is a search field. Attributes or form action containing "search", or parent element holding
 * role="search" will be identified as a search field.
 * @param {HTMLInputElement} target 
 */
miscFields.isSearchField = function (target) {
    // Check element attributes
    for (const attr of target.attributes) {
        // ??? research
        // ??? attr.value === "q"
        if ((attr.value && (attr.value.toLowerCase().includes("search")) || attr.value === "q")) {
            return true;
        }
    }

    // Check closest form
    const closestForm = misc.getForm(target);
    if (closestForm && miscFields.isSearchForm(closestForm)) {
        return true;
    }

    // Check parent elements for role="search"
    if (target.closest("[role~=\"search\"]")) {
        return true;
    }

    return false;
};

/**
 * Returns true if element is visible on the page
 * @param {Element} elem 
 */
miscFields.isVisible = function (elem) {
    // Check element position and size
    const rect = elem.getBoundingClientRect();
    if (rect.x < 0 ||
        rect.y < 0 ||
        rect.width < 8 ||
        rect.x > Math.max(document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth) ||
        rect.y > Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight) ||
        rect.height < 8) {
        return false;
    }

    // Check CSS visibility
    const elementStyle = getComputedStyle(elem);
    if (elementStyle.getPropertyValue("visibility") === "hidden" || elementStyle.getPropertyValue("visibility") === "collapse") {
        return false;
    }

    // Check for parent opacity
    if (this.traverseParents(elem, function (f) { return f.style.opacity === "0"; })) {
        return false;
    }

    return true;
};

/**
 * Returns the first parent element satifying the {@code predicate} mapped by {@code resultFn} or else {@code defaultValFn}.
 * @param {HTMLElement} element     The start element (excluded, starting with the parents)
 * @param {function} predicate      Matcher for the element to find, type (HTMLElement) => boolean
 * @param {function} resultFn       Callback function of type (HTMLElement) => {*} called for the first matching element
 * @param {function} defaultValFn   Fallback return value supplier, if no element matching the predicate can be found
 */
miscFields.traverseParents = function (element, predicate, resultFn = function () { return true; }, defaultValFn = function () { return false; }) {
    for (let f = element.parentElement; f !== null; f = f.parentElement) {
        if (predicate(f)) {
            return resultFn(f);
        }
    }

    return defaultValFn();
};

/**
 * @Object miscObserverHelper
 * MutationObserver handler for dynamically added input fields.
 */
const miscObserverHelper = {};

miscObserverHelper.ignoredNodeNames = [
    "G",
    "PATH",
    "SVG",
    "A",
    "HEAD",
    "HTML",
    "LABEL",
    "LINK",
    "SCRIPT",
    "SPAN",
    "VIDEO"
];

// ??? Node.DOCUMENT_NODE Node.DOCUMENT_FRAGMENT_NODE
// ??? Deprecated node type constants
// ??? The following constants have been deprecated and should not be used anymore.
// ??? Node.ENTITY_REFERENCE_NODE Node.ENTITY_NODE Node.NOTATION_NODE
miscObserverHelper.ignoredNodeTypes = [
    Node.ATTRIBUTE_NODE,
    Node.TEXT_NODE,
    Node.CDATA_SECTION_NODE,
    Node.PROCESSING_INSTRUCTION_NODE,
    Node.COMMENT_NODE,
    Node.DOCUMENT_TYPE_NODE,
    Node.NOTATION_NODE
];

// ??? username undefined null HTMLInputElement.prototype.type
miscObserverHelper.inputTypes = [
    "text",
    "email",
    "password",
    "tel",
    "number",
    "username", // Note: Not a standard
    undefined, // Input field can be without any type. Include this and null to the list.
    null
];

/**
 * Gets input fields from the target
 * @param {Element} target 
 * @param {boolean} ignoreVisibility 
 */
miscObserverHelper.getInputs = function (target, ignoreVisibility = false) {
    // Ignores target element if it's not an element node
    if (this.ignoredNode(target)) {
        return [];
    }

    // Filter out any input fields with type "hidden" right away
    const inputFields = [];
    Array.from(target.getElementsByTagName("input")).forEach(
        function (e) {
            if (e.type !== "hidden" && !e.disabled && !this.alreadyIdentified(e)) {
                inputFields.push(e);
            }
        }.bind(this)
    );

    // Append any input fields in Shadow DOM
    if (target.shadowRoot) {
        target.shadowSelectorAll("input").forEach(
            function (e) {
                if (e.type !== "hidden" && !e.disabled && !this.alreadyIdentified(e)) {
                    inputFields.push(e);
                }
            }.bind(this)
        );
    }

    if (inputFields.length === 0) {
        return [];
    }

    // ??? order
    // Do not allow more visible inputs than _maximumInputs (default value: 100) -> return the first 100
    if (inputFields.length > _maximumInputs) {
        return inputFields.slice(0, _maximumInputs);
    }

    // ??? order
    // Only include input fields that match with miscObserverHelper.inputTypes
    const inputs = [];
    for (const field of inputFields) {
        if (!ignoreVisibility && !miscFields.isVisible(field)) {
            continue;
        }

        // ??? const type = field.getLowerCaseAttribute("type");
        const type = field.type;
        if (miscObserverHelper.inputTypes.includes(type)) {
            inputs.push(field);
        }
    }

    return inputs;
};

/**
 * Checks if the input field has already identified at page load
 * @param {Element} target 
 */
miscObserverHelper.alreadyIdentified = function (target) {
    return misc.inputs.includes(target);
};

/**
 * Ignores all nodes that doesn't contain elements
 * 
 * Also ignore few Youtube-specific custom nodeNames
 * @param {Node} target
 */
miscObserverHelper.ignoredNode = function (target) {
    if (!target ||
        this.ignoredNodeTypes.includes(target.nodeType) ||
        this.ignoredNodeNames.includes(target.nodeName) ||
        target.nodeName.startsWith("YTMUSIC") ||
        target.nodeName.startsWith("YT-")) {
        return true;
    }
    return false;
};

/**
 * @Object misc
 * The main content script object.
 */
const misc = {};

misc.combinations = [];
misc.detectedFields = 0;
misc.inputs = [];
misc.singleInputEnabledForPage = false;

/**
 * Returns the form that includes the inputField
 * @param {HTMLInputElement} inputField 
 */
misc.getForm = function (inputField) {
    if (inputField.form) {
        return inputField.form;
    }

    for (const f of document.forms) {
        for (const e of f.elements) {
            if (e === inputField) {
                return f;
            }
        }
    }
};

/**
 * Identifies all forms in the page
 */
misc.identifyFormInputs = function () {
    const forms = [];
    const documentForms = document.forms; // Cache the value just in case

    for (const form of documentForms) {
        if (!miscFields.isVisible(form)) {
            continue;
        }

        if (miscFields.isSearchForm(form)) {
            continue;
        }

        forms.push(form);
    }

    // Identify input fields in the saved forms
    const inputs = [];
    for (const form of forms) {
        const formInputs = miscObserverHelper.getInputs(form);
        for (const f of formInputs) {
            inputs.push(f);
        }
    }

    misc.initCombinations(inputs);
    return inputs;
};

/**
 * Looks for any username & password combinations from the detected input fields
 * @param {HTMLInputElement[]} inputs 
 */
misc.initCombinations = function (inputs = []) {
    if (inputs.length === 0) {
        return [];
    }

    const combinations = miscFields.getAllCombinations(inputs);
    if (!combinations || combinations.length === 0) {
        return [];
    }

    for (const c of combinations) {
        // Don't allow duplicates
        if (!misc.combinations.some(f => f.username === c.username && f.password === c.password && f.totp === c.totp && f.form === c.form)) {
            misc.combinations.push(c);
        }
    }

    return combinations;
};

/**
 * The main function for finding input fields
 */
misc.initCredentialFields = function () {
    // Identify all forms in the page
    const formInputs = misc.identifyFormInputs();

    // Search all remaining inputs from the page, ignore the previous input fields
    const pageInputs = miscFields.getAllPageInputs(formInputs);
    // if (formInputs.length === 0 && pageInputs.length === 0) {
    //     // Run "redetect_credentials" manually if no fields are found after a page load
    //     setTimeout(async function() {
    //         if (_called.automaticRedetectCompleted) {
    //             return;
    //         }

    //         if (misc.inputs.length === 0 || misc.combinations.length === 0) {
    //             misc.initCredentialFields();
    //         }
    //         _called.automaticRedetectCompleted = true;
    //     }, 2000);

    //     return;
    // }

    // Combine inputs
    misc.inputs = [...formInputs, ...pageInputs];

    const hideUsernameField = function (c) {
        if (c.username && !c.username.readOnly) {
            c.username.style.color = "transparent";
            c.username.classList.add("misc-hidden");
        }
    }
    for (const c of misc.combinations) {
        hideUsernameField(c);
    }
};

const initContentScript = function () {
    try {
        misc.initCredentialFields();
        console.log(misc.combinations);
        console.log(misc.inputs);
    } catch (err) {
        console.log("initContentScript error: ", err);
    }
};

if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    initContentScript();
} else {
    document.addEventListener("DOMContentLoaded", initContentScript);
}