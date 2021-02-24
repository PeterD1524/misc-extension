chrome.contextMenus.create(
    {
        "id": "Copy link text",
        "title": "Copy link text",
        "contexts": ["link"],
    },
    function () {
        if ("lastError" in chrome.runtime) {
            console.log("chrome.runtime.lastError.message", chrome.runtime.lastError.message);
        }
    }
);
chrome.contextMenus.create(
    {
        "id": "Search Google for link text",
        "title": "Search Google for link text",
        "contexts": ["link"],
    },
    function () {
        if ("lastError" in chrome.runtime) {
            console.log("chrome.runtime.lastError.message", chrome.runtime.lastError.message);
        }
    }
);
chrome.contextMenus.create(
    {
        "id": "Copy image as data URI",
        "title": "Copy image as data URI",
        "contexts": ["image"],
    },
    function () {
        if ("lastError" in chrome.runtime) {
            console.log("chrome.runtime.lastError.message", chrome.runtime.lastError.message);
        }
    }
);
chrome.contextMenus.create(
    {
        "id": "Rotate clockwise",
        "title": "Rotate clockwise",
        "contexts": ["image", "video"],
    },
    function () {
        if ("lastError" in chrome.runtime) {
            console.log("chrome.runtime.lastError.message", chrome.runtime.lastError.message);
        }
    }
);
chrome.contextMenus.create(
    {
        "id": "Rotate counterclockwise",
        "title": "Rotate counterclockwise",
        "contexts": ["image", "video"],
    },
    function () {
        if ("lastError" in chrome.runtime) {
            console.log("chrome.runtime.lastError.message", chrome.runtime.lastError.message);
        }
    }
);
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    console.log(info);
    console.log(tab);
    let message = {};
    message[info["menuItemId"]] = [];
    let options = {};
    if ("frameId" in info) {
        options["frameId"] = info["frameId"];
    }
    chrome.tabs.sendMessage(tab["id"], message, options, function (response) {
        if (arguments.length === 0) {
            console.log("chrome.runtime.lastError.message", chrome.runtime.lastError.message);
        } else {
            console.log("response", response);
            if ("chrome.runtime.lastError.message" in response) {

            }
        }
    });
});