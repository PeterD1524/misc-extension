let contextmenuElement = undefined;
document.addEventListener("contextmenu", function (event) {
    contextmenuElement = event.target;
}, true);
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    const element = contextmenuElement;
    console.log(sender);
    console.log(message);
    if (element === undefined) {
        alert("Failed :(");
    } else {
        console.log(element.tagName);
        let requests = Object.keys(message);
        if (Object.keys(message).length == 1) {
            let request = requests[0];
            if (request === "Copy link text") {
                if (element.textContent.trim() !== "") {
                    navigator.clipboard.writeText(element.textContent.trim()).then(function () {
                        /* clipboard successfully set */
                        console.log("/* clipboard successfully set */");
                    }, function () {
                        /* clipboard write failed */
                        alert("/* clipboard write failed */");
                        console.log("/* clipboard write failed */");
                    });
                }
            } else if (request === "Search Google for link text") {
                if (element.textContent.trim() !== "") {
                    let url = new URL("https://www.google.com/search");
                    let value = element.textContent.trim().split(/\s+/);
                    value = value.join(" ");
                    url.searchParams.set("q", value);
                    window.open(url.href, "_blank");
                }
            } else if (request === "Copy image as data URI") {
                if (element.tagName === "IMG") {
                    fetch(new Request(element.src)).then(function (response) {
                        response.blob().then(function (blob) {
                            let reader = new FileReader();
                            reader.addEventListener("load", function () {
                                let dataURI = reader.result;
                                navigator.clipboard.writeText(dataURI).then(function () {
                                    /* clipboard successfully set */
                                    console.log("/* clipboard successfully set */");
                                }, function () {
                                    /* clipboard write failed */
                                    alert("/* clipboard write failed */");
                                    console.log("/* clipboard write failed */");
                                });
                            });
                            reader.readAsDataURL(blob);
                            // let image = new Image();
                            // image.addEventListener("load", function (event) {
                            //     let canvas = document.createElement("canvas");
                            //     canvas.width = image.width;
                            //     canvas.height = image.height;
                            //     let ctx = canvas.getContext("2d");
                            //     ctx.drawImage(image, 0, 0);
                            //     let dataURI = canvas.toDataURL(blob.type, 1);
                            //     navigator.clipboard.writeText(dataURI).then(function () {
                            //         /* clipboard successfully set */
                            //         console.log("/* clipboard successfully set */");
                            //     }, function () {
                            //         /* clipboard write failed */
                            //         alert("/* clipboard write failed */");
                            //         console.log("/* clipboard write failed */");
                            //     });
                            // });
                            // image.src = URL.createObjectURL(blob);
                        });
                    });
                }
            } else if (request === "Rotate clockwise") {
                if (element.tagName === "IMG" || element.tagName === "VIDEO") {
                    element.style.transform += " rotate(90deg)";
                }
            } else if (request === "Rotate counterclockwise") {
                if (element.tagName === "IMG" || element.tagName === "VIDEO") {
                    element.style.transform += " rotate(-90deg)";
                }
            }
        } else {

        }
    }
});