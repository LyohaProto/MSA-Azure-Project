// A class for storing all the useful data obtained from MS Cognitive Services API
class ActorData {
    name: string;
    faceRectangleX: number;
    faceRectangleY: number;
    faceRectangleWidth: number;
    faceRectangleHeight: number;
    constructor(actorName: string, frX: number, frY: number, frW: number, frH: number) {
        this.name = actorName;
        this.faceRectangleX = frX;
        this.faceRectangleY = frY;
        this.faceRectangleWidth = frW;
        this.faceRectangleHeight = frH;
    }
}
// Array of all the actors who were recognized on the given photo
var recognizedActorsData: Array<ActorData> = new Array<ActorData>();

// Bootstrap elements
var snapshotImageFileSelector: HTMLInputElement = <HTMLInputElement>$("#snapshot-image-file-selector")[0];
var uploadImageButton = $("#upload-image-button")[0];
var uploadedImage: HTMLImageElement = <HTMLImageElement>$("#uploaded-image")[0];
var uploadedImageContainer: HTMLDivElement = <HTMLDivElement>$("#uploaded-image-container")[0];
var faceRectanglesLayer: HTMLDivElement = <HTMLDivElement>$("#face-rectangles-layer")[0];
var uploadedImageLayer: HTMLDivElement = <HTMLDivElement>$("#uploaded-image-layer")[0];
var pageheader = $("#page-header")[0];
//var linkToImdb : HTMLAnchorElement = <HTMLAnchorElement>$("#actor")[0];

//
var imageFile;
var imageScale: number = 1;

// User uploaded the snapshot
snapshotImageFileSelector.addEventListener("change", function () {
    imageFile = snapshotImageFileSelector.files[0];
    var reader = new FileReader();

    if (imageFile.name.match(/\.(jpg|jpeg|png)$/)) {
        if (imageFile) {
            reader.readAsDataURL(imageFile);

            // When user has selected the image - start to analyze it.
            reader.onloadend = imageIsSelected;
            pageheader.innerHTML = "Analyzing the image..."
        } else {
            console.log("Invalid file");
        }
    } else {
        alert("Incorrect image.")
    }
});

// Display selected image
function imageIsSelected(ev) {
    // Assigning image element with uploaded image data
    uploadedImage.setAttribute('src', ev.target.result);

    // Updating the div that represents image layer
    uploadedImageLayer.style.top = `-${uploadedImage.height}px`;

    // Clear old face rectangles (if any) and update the size of face rectangles layer div to match the uploaded image
    while (faceRectanglesLayer.firstChild) {
        faceRectanglesLayer.removeChild(faceRectanglesLayer.firstChild);
    }
    faceRectanglesLayer.style.height = `${uploadedImage.height}px`;
    //faceRectanglesLayer.style.width = uploadedImage.width.toString() + "px"; //TODO: Why it is Zero ?

    // Show the main container
    uploadedImageContainer.style.height = `${uploadedImage.height}px`;
    uploadedImageContainer.style.display = "block";

    sentImageToProjectoxford(imageFile);
};

// Here all the magic happens :)
function sentImageToProjectoxford(file): void {
    $.ajax({
        url: "https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Faces&details=Celebrities",
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
            // Don't steal my Subscription Key, please!
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "d78a6d8a8f6540e3868962b00c25f606");
        },
        type: "POST",
        data: file,
        processData: false
    })
        .done(function (data) {
            //TODO: Is it really needed here?
            //uploadButton.innerText = "Upload another snapshot";

            if (data.length != 0) { // if server answered with some data
                if (typeof data.categories[0].detail === 'undefined') { // If nothing at all was recognized
                    pageheader.innerHTML = "Unfortunately, we cannot identify this picture ¯\\_(ツ)_/¯";
                    return;
                }
                else // If no actors was recognized
                    if (typeof data.categories[0].detail.celebrities === 'undefined' || data.categories[0].detail.celebrities.length === 0) {
                        pageheader.innerHTML = "Unfortunately, we cannot identify any actors on this picture ¯\\_(ツ)_/¯<br>Try to upload another one.";
                        return;
                    }

                // Get the image scale
                // TODO: Get image height from client side
                imageScale = data.metadata.height / uploadedImage.height;

                // Fill the array with identifyed actors' data.
                recognizedActorsData = [];
                data.categories[0].detail.celebrities.forEach(element => {
                    recognizedActorsData.push(new ActorData(element.name,
                        element.faceRectangle.left,
                        element.faceRectangle.top,
                        element.faceRectangle.width,
                        element.faceRectangle.height)
                    );
                });

                // Add face rectangles
                addFaceRectangles();

                // Form a linguistic-friendly list of actors found (one, two or several).            
                pageheader.innerHTML = createLinkToIMDB(recognizedActorsData[0].name, 0); //recognizedActorsData[0].name;
                if (recognizedActorsData.length > 1) {
                    for (var i = 1; i < recognizedActorsData.length - 1; i++) {
                        pageheader.innerHTML += ", " + createLinkToIMDB(recognizedActorsData[i].name, i);
                    }
                    pageheader.innerHTML += " and " + createLinkToIMDB(recognizedActorsData[recognizedActorsData.length - 1].name, recognizedActorsData.length - 1);
                }

                // TODO: Add IMDB integration.
                //GetDataFromIMDB(recognizedActorsData[0].name);

            } else { // if server answered with no data
                pageheader.innerHTML = "Unfortunately, we cannot identify this picture ¯\\_(ツ)_/¯";
            }
        })
        .fail(function (error) {
            pageheader.innerHTML = "Connection error. Try to refresh the page.";
            console.log(error.getAllResponseHeaders());
        });
}

function addFaceRectangles() {
    // TODO: understand why I need to double inicialize height of faceRectanglesLayer (it becomes zero othervise)
    faceRectanglesLayer.style.height = uploadedImage.height.toString() + "px";
    faceRectanglesLayer.style.width = uploadedImage.width.toString() + "px";

    var id: number = 0;
    recognizedActorsData.forEach(element => {
        faceRectanglesLayer.innerHTML += `<div class="div-face-rectangle" id="faceRectangle-${id}" \
        style="left: ${(element.faceRectangleX / imageScale).toFixed(0)}px; \
        top: ${(element.faceRectangleY / imageScale).toFixed(0)}px; \
        width: ${(element.faceRectangleWidth / imageScale).toFixed(0)}px; \
        height: ${(element.faceRectangleHeight / imageScale).toFixed(0)}px;">`;
        // border: 2px solid red; border-radius: 5px;" onmouseover="showFaceRectangle(' + id + ')">`;           
        id++;
    });
}

// Simple function to replace actors names with links to IMDB search and add to each link a function to show face rectangle on mouseover.
function createLinkToIMDB(actorName: string, id: number): string {
    return `<a class="actor" data-actor="${id}" href="http://www.imdb.com/search/name?name=${actorName.replace(" ", "%20")}" target="_blank" onmouseover="showFaceRectangle(${id})" onmouseout="hideFaceRectangle(${id})">${actorName}</a>`;
}

function showFaceRectangle(id) {
    var faceRect: HTMLDivElement = <HTMLDivElement>document.getElementById(`faceRectangle-${id}`);
    faceRect.style.borderStyle = "solid";
}

function hideFaceRectangle(id) {
    var faceRect: HTMLDivElement = <HTMLDivElement>document.getElementById(`faceRectangle-${id}`);
    faceRect.style.borderStyle = "none";
}

/* TODO: Add IMDB integration.
function GetDataFromIMDB(actorName): void {
    $.ajax({
        async: true,
        crossDomain: true,
        url: "https://moviesapi.com/m.php?t=" + actorName + "&y=&type=person&r=json",
        method: "POST",
        "headers": {
            "cache-control": "no-cache"
        }
    })
        .done(function (response) {
            console.log(response);
        })
        .fail(function (response) {
            pageheader.innerHTML = "IMDB error";
            console.log(response.getAllResponseHeaders());
        });
} */