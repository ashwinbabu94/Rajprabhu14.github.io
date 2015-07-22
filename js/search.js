
/** Search button event listener **/
$("#searchButton").on("click", function (e) { app.NearBy.onClickHandler(); });



app.NearBy._initializeElement = function () {
    app.NearBy.PlacesService = new google.maps.places.PlacesService(app.Base.map);    
}


/** 1.0 onClick Handler **/

app.NearBy.onClickHandler = function () {

    // * Gathering info & pre-process executables    
    $("#searchErrorMessageDiv").html(""); // setting the div back to the default state if there were any error messages shown.

    app.NearBy.latitude = $("#searchLatitude").val();
    app.NearBy.longitude = $("#searchLongitude").val();
    app.NearBy.category = $("#searchCategory").val();
    app.NearBy.radius = $("#searchRadius").val();


    // * creating the circle (overlay)
    if (app.NearBy.circleOverlayObj != undefined) {
        app.NearBy.circleOverlayObj.setMap(null);
    }

    var circleOptions = {
        strokeColor: '#191970',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#000000',
        fillOpacity: 0.15,
        map: app.Base.map,
        center: new google.maps.LatLng(app.NearBy.latitude, app.NearBy.longitude),
        radius: app.NearBy.radius * 1000
    };
    app.NearBy.circleOverlayObj = new google.maps.Circle(circleOptions);


    // * Places request and results 
    var validation_boolean = app.NearBy.Validation([app.NearBy.latitude, app.NearBy.longitude, app.NearBy.category, app.NearBy.radius]); //calling the validation function to check if the input provided are correct.
    if (validation_boolean) {
        app.NearBy.PlacesRequestHandler([app.NearBy.latitude, app.NearBy.longitude, app.NearBy.category, app.NearBy.radius]);
    }

    // * setting map to center
    app.Base.map.setCenter(new google.maps.LatLng(app.NearBy.latitude, app.NearBy.longitude));
    app.Base.map.fitBounds(app.NearBy.circleOverlayObj.getBounds())

}

app.NearBy.PlacesRequestHandler = function (arr) {

    var request = {};
    var latlongobj = new google.maps.LatLng(arr[0], arr[1]);

    /** request params **/
    request.location = latlongobj;
    request.radius = arr[3] * 1000;
    request.query =  arr[2];
    // request.types = app.NearBy.placesTypeSync[arr[2]];    //commented out because of poor results obtained in call back.

    app.NearBy.PlacesService.textSearch(request, app.NearBy.PlacesCallbackHandler);
}

app.NearBy.PlacesCallbackHandler = function (results, status) {

    switch (status) {
        case "OK":
            app.NearBy.PlacesResultsDisplayHandler(results);
            break;

        case "ERROR":
            $("#searchErrorMessageDiv").html("There was a problem contacting the Google servers.");
            break;

        case "INVALID_REQUEST":
            $("#searchErrorMessageDiv").html("The request sent was invalid.");
            break;

        case "OVER_QUERY_LIMIT":
            $("#searchErrorMessageDiv").html("This webpage has gone over its request quota. Cannot fetch the results");
            break;

        case "REQUEST_DENIED":
            $("#searchErrorMessageDiv").html("he webpage is not allowed to use the PlacesService.");
            break;

        case "UNKNOWN_ERROR":
            $("#searchErrorMessageDiv").html("The PlacesService request could not be processed due to a server error. The request may succeed if you try again.");
            break;

        case "ZERO_RESULTS":
            $("#searchErrorMessageDiv").html("No result was found for this request.");
            break;
    }
}

app.NearBy.PlacesResultsDisplayHandler = function (Results) {

    app.NearBy.MarkerRemoveHandler(app.NearBy.MarkersArray); // clearing all the overlays before adding new batch.
    app.NearBy.MarkersArray = [];

    for (var i = 0; i < Results.length; i++) {
        if (app.NearBy.circleOverlayObj.contains(Results[i].geometry.location)) {
          app.NearBy.PlacesResultsMarkerAddHandler(Results[i]);
        }
    }
}

app.NearBy.PlacesResultsMarkerAddHandler = function (placeObject) {
   
    var marker = new google.maps.Marker({
        map: app.Base.map,
        anchorPoint: new google.maps.Point(0, -29)
    }); //creating new marker object

    marker.setIcon(({
        url: "/assets/images/markers/" + app.NearBy.iconSync[app.NearBy.category] + ".png",  
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(35, 35)
    })); //setting corresponding icon
   

    marker.setPosition(placeObject.geometry.location);
    marker.setVisible(true);
    app.NearBy.MarkersArray.push(marker);

    google.maps.event.addListener(marker, 'click', app.NearBy.PlacesResultsMarkerclickHandler);
    google.maps.event.addListener(marker, 'mouseover', app.NearBy.PlacesResultsMarkerHoverHandler);

}


app.NearBy.MarkerRemoveHandler = function (MarkersArray) {

    if (MarkersArray !== undefined) {
        for (var i = 0; i < MarkersArray.length; i++) {
            MarkersArray[i].setMap(null);
        }
    }

}

app.NearBy.PlacesResultsMarkerclickHandler = function (e) {
    console.log(e);
}

app.NearBy.PlacesResultsMarkerHoverHandler = function (e) {
    console.log(e);
}


/** validation handler for user input   **/

app.NearBy.Validation = function (arr) {

    var decimal = /^\d+\.\d{0,10}$/;  // regEx test for decimal upto 10 decimal places
    var number = /^-?\d+\.?\d*$/;     // regEx for signed numbers + float as well
    var datacheck1 = (decimal.test(arr[0]) || number.test(arr[0])) && (decimal.test(arr[1]) || number.test(arr[1])) && (decimal.test(arr[3]) || number.test(arr[3]));  // testing all the numeric inputs for their data type
    var datacheck2 = (arr[3] > 0 && arr[3] <= 3); // testing if the radius inpu is > 0 & < 3 ( we are restricting the radial search to 3 km. )

    if (datacheck1 && datacheck2) { return true; }
    else {
        $("#searchErrorMessageDiv").html("Please enter the input properly for processing. For detailed functional description , read the documentation.");
        return false;
    }
}


/** synchronization of given places type with the places_type of google places api
    Reference: (https://developers.google.com/places/supported_types)

    placesTypeSync object is used in syncing the places type in the Radar Search request object.

**/

app.NearBy.placesTypeSync = {

        "ATM":"atm",
        "Bank":"bank",
        "Clinic":"doctor",
        "Hospital":"hospital",
        "Restaurant":"restaurant"
}

app.NearBy.iconSync = {

    "ATM": "atm",
    "Bank": "bank",
    "Clinic": "clinic",
    "Hospital": "hospital",
    "Restaurant": "restaurant"    
}
