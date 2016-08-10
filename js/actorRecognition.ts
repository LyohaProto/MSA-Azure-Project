var imgSelector: HTMLInputElement = <HTMLInputElement>$("#my-file-selector")[0];
var imgPreview = $("#myImg")[0];
var pageheader = $("#page-header")[0];

// User uploaded the photo
imgSelector.addEventListener("change", function () {
    pageheader.innerHTML = "Loading your image..."
    var imageFile = imgSelector.files[0];
    var reader = new FileReader();

    if (imageFile.name.match(/\.(jpg|jpeg|png)$/)) {
        if (imageFile) {
            reader.readAsDataURL(imageFile);
            reader.onloadend = imageIsLoaded;

            pageheader.innerHTML = "Identifing the actor..."
            sentImageToProjectoxford(imageFile);
            console.log("file sent");
        } else {
            console.log("Invalid file");
        }
    } else {
        alert("Incorrect image.")
    }
});

function imageIsLoaded(ev) {
    imgPreview.setAttribute('src', ev.target.result);

    //sentImageToProjectoxford(ev.target.result);
};

function sentImageToProjectoxford(file): void {
    $.ajax({
        url: "https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Faces&details=Celebrities",
        beforeSend: function (xhrObj) {
            // Request headers
            xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "d78a6d8a8f6540e3868962b00c25f606");
        },
        type: "POST",
        data: file,
        processData: false
    })
        .done(function (data) {
            if (data.length != 0) { // if a face is detected
                // Get the emotion scores
                //var scores = data[0].scores;
                pageheader.innerHTML = "Searching the actors in IMDB..."
               // var parsed_data = data[0].categories;
                pageheader.innerHTML = data.categories[0].detail.celebrities[0].name;
            } else {
                pageheader.innerHTML = "Hmm, we can't detect a human face in that photo. Try another?";
            }
        })
        .fail(function (error) {
            pageheader.innerHTML = "Sorry, something went wrong. :( Try again in a bit?";
            console.log(error.getAllResponseHeaders());
        });
}