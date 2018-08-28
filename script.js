// Stores tracked usernames
var trackedNames = ["vgbootcamp","ESL_SC2", "OgamingSC2", "cretetion", "freecodecamp", "storbeck", "habathcx", "RobotCaleb", "noobs2ninjas"];

/// <summary> Helper function to access Twitch API. </summary>
/// <param name="username" type"String"> The username to search for. </param>
/// <param name="type" type"String"> Which database to search. WARNING: Will be depreciated December 2018! </param>
function GetURL(username,type) {
  return "https://wind-bow.gomix.me/twitch-api/"+type+"/"+username+"?callback=?";
}

/// <summary> Helper function to load default usernames at startup. </summary>
function populateDefaultList() {
  trackedNames.forEach(function(name) {
    GetStreamInfo(name);
  })
}

/// <summary> Pull specified username data from Twitch API, and create info card. Needs to make two seperate calls due to the way that Twitch organizes their data. </summary>
/// <param name="username" type="String"> The username to search for. </param>
function GetStreamInfo(username) {
  $.getJSON(GetURL(username,"users"), function(userData) {
    // Create page elements
    var container = $('<div class="twitch-container"></div>');
    var statusBar = $('<div class="status-bar"><div class="clear"></div><div class="down"></div><div class="up"></div></div>');
    var iconContainer = $('<img class="stream-icon" src="http://placehold.it/100x100">');
    var channelInfo = $('<div class="channel-info"><p class="stream-name"></p><p class="stream-status">Channel coming soon!</p><a class="stream-link">Link unavailable</a></div>');

    // Append elements to one another.
    container.append(statusBar).append(iconContainer).append(channelInfo);

    // Fill in data.
    channelInfo.children('.stream-name').html(userData.display_name);
    channelInfo.children('.stream-link').attr({"href":"http://www.twitch.tv/" + userData.display_name,"target":"_blank"});

    // Twitch's API creates placeholder entries for banned usernames and usernames
    // that have not been created yet. So, in order to make sure that the name is
    // real, check to see if an icon has been set up. If so, then it is a real user.
    if (userData.logo !== null && userData.display_name !== undefined) {
      // Pulls additional information not available in first call.
      $.getJSON(GetURL(username,"streams"), function(streamData) {

        iconContainer.attr({"src":userData.logo});

        if (streamData.stream) {
          channelInfo.children('.stream-status').html(streamData.stream.channel.status);
          channelInfo.children('.stream-link').html("Watch Stream");
          container.addClass("active");
        } else {
          channelInfo.children('.stream-status').html("Offline");
          channelInfo.children('.stream-link').html("Visit Channel");
          container.addClass("offline");
        }
      });
    } else {
      container.addClass("unrecognized");
      // Fallback in case username comes back as undefined.
      channelInfo.children('.stream-name').html(username);
    }

    $(".stream-list-container").append(container);
  });
}

$(document).ready(function() {
  // Load in default entries
  populateDefaultList();

  // Switch which cards are displayed
  $(".display-option").on("click",function() {
    $(".display-option").removeClass("selected");
    $(this).addClass("selected");

    switch($(this).html()) {
      case "All":
        $(".twitch-container").css({"display":"block"});
        break;
      case "Live":
        $(".twitch-container.active").css({"display":"block"});
        $(".twitch-container:not(.active)").css({"display":"none"});
        break;
      case "Offline":
        $(".twitch-container.active").css({"display":"none"});
        $(".twitch-container:not(.active)").css({"display":"block"});
        break;
                         }
  });

  // Remove specified user from trackedNames array, and remove element from page.
  $(".stream-list-container").on("click",".clear",function() {
    var nameToRemove = $(this).parents(".twitch-container").find(".stream-name").text();
    trackedNames = trackedNames.splice(trackedNames.indexOf(nameToRemove),trackedNames.indexOf(nameToRemove) + 1);
    $(this).closest(".twitch-container").remove();
  });

  // Swap elements around in page, upwards.
  $(".stream-list-container").on("click",".up",function() {
    var currentView = $(".display-option.selected").html();
    var selection = "";
    switch(currentView) {
      case "Live":
        selection = ".active";
        break;
      case "Offline":
        selection = ":not(.active)"
        break;
                      }

    var item = $(this).closest(".twitch-container");
    item.insertBefore(item.prevAll(".twitch-container"+ selection +":first"));
  });

  // Swap elements around in page, downwards.
  $(".stream-list-container").on("click",".down",function() {
    var currentView = $(".display-option.selected").html();
    var selection = "";
    switch(currentView) {
      case "Live":
        selection = ".active";
        break;
      case "Offline":
        selection = ":not(.active)"
        break;
                      }

    var item = $(this).closest(".twitch-container");
    item.insertAfter(item.nextAll(".twitch-container"+ selection +":first"));
  });

  // Bring up "Add user menu".
  $(".add-stream").click(function() {
    $(".add-stream-overlay").fadeIn();
    $(".add-stream-menu").animate({"margin-top":"30vh"})
  });

  // Hide "Add user menu", and clear any information on it.
  $(".add-stream-menu .clear").click(function() {
    $("#new-streamer").val("");
    $(".add-stream-menu .error").html("");
    $(".add-stream-overlay").fadeOut();
    $(".add-stream-menu").animate({"margin-top":"0"})
  });

  // Add new username to trackedNames array, and create element on page.
  $("#submit").click(function() {
    var streamerToAdd = $("#new-streamer").val();

    if (trackedNames.indexOf(streamerToAdd) !== -1) {
      $(".add-stream-menu .error").html("Username is already being tracked!");
      return;
    }

    trackedNames.push(streamerToAdd);
    GetStreamInfo(streamerToAdd);
    $(".add-stream-menu .clear").trigger("click");
  });

  // Initiate search when user hits enter key into search bar.
  $('#new-streamer').keyup(function(e){
    if(e.keyCode == 13)
    {
      $("#submit").trigger("click");
    }
  });
});