(function () {

  /** Array used to store tracked streamers */
  var trackedNames = ["vgbootcamp","ESL_SC2", "OgamingSC2", "cretetion", "freecodecamp", "storbeck", "habathcx", "RobotCaleb", "noobs2ninjas"];

  /** Enum helper variable */
  var DIRECTION = Object.freeze({
    UP: "DIRECTION_UP",
    DOWN: "DIRECTION_DOWN"
  });


  /** Helper function to access Twitch API.
  * @param {String} username - The username to search for.
  * @param {String} type - Which database to search.
  */
  function GetURL(username,type) {
    return "https://wind-bow.gomix.me/twitch-api/"+type+"/"+username+"?callback=?";
  }

  /* Helper function to load default usernames at startup. */
  function populateDefaultList() {
    trackedNames.forEach(function(name) {
      GetStreamInfo(name);
    });
  }

  /* Pull specified username data from Twitch API, and create info card. Needs to make two seperate calls due to the way that Twitch organizes their data.
  * @param{String} username - The username to search for.
  */
  function GetStreamInfo(username) {
    $.getJSON(GetURL(username,"users"), function(userData) {
      // Create page elements
      var container = $('<div class="twitch-container"></div>');
      var statusBar = $('<div class="status-bar"><div class="clear"></div><div class="sort-down-arrow"></div><div class="sort-up-arrow"></div></div>');
      var iconContainer = $('<img class="stream-icon" src="http://placehold.it/100x100">');
      var channelInfo = $('<div class="channel-info"><div class="stream-name"></div><div class="stream-status">Channel coming soon!</div><a class="stream-link">Link unavailable</a></div>');

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

  /* Add new streamer to trackedNames array, if it matches requirements */
  function addNewStreamer() {
    var streamerToAdd = $("#new-streamer").val();

    if (trackedNames.indexOf(streamerToAdd) !== -1) {
      $(".add-stream-menu .error").html("Username is already being tracked!");
      return;
    }

    if (streamerToAdd.length < 4 || streamerToAdd.length > 25) {
      $(".add-stream-menu .error").html("Username must be between 4 and 25 characters");
      return;
    }

    trackedNames.push(streamerToAdd);
    GetStreamInfo(streamerToAdd);
    closeMenu();
  }

  /** Swap streamer card with the one immediately next to it.
  * @param {jQuery} el - The jQuery element that called the function.
  * @param {String} type - The direction in which to move.
  */
  function swapStreamer(el, direction) {
    var currentView = $(".display-option.selected").html();
    var selection = "";
    switch(currentView) {
      case "Live":
        selection = ".active";
        break;
      case "Offline":
        selection = ":not(.active)";
        break;
                      }

    var item = $(el).closest(".twitch-container");
    if (direction === DIRECTION.UP) {
      item.insertBefore(item.prevAll(".twitch-container"+ selection +":first"));
    } else if (direction === DIRECTION.DOWN) {
      item.insertAfter(item.nextAll(".twitch-container"+ selection +":first"));
    }
  }

  /** Remove streamer from view and from trackedNames array
  * @param {jQuery} el - The jQuery element that called the function.
  */
  function deleteStreamer(el) {
    console.log('clicked!');
    var nameToRemove = $(el).parents(".twitch-container").find(".stream-name").text();
    trackedNames = trackedNames.splice(trackedNames.indexOf(nameToRemove),trackedNames.indexOf(nameToRemove) + 1);
    $(el).closest(".twitch-container").remove();
  }

  /** Helper function used to close "add streamer" popup, and clears entered data*/
  function closeMenu() {
    $("#new-streamer").val("");
    $(".add-stream-menu .error").html("");
    $(".add-stream-overlay").fadeOut();
    $(".add-stream-menu").animate({"margin-top":"0"});
  }

  /** Toggle which streamers are visible.
  * @param {jQuery} el - The jQuery element that called the function.
  */
  function toggleVisibleStreamers(el) {
    console.log(el);
    $(".display-option").removeClass("selected");
    $(el).addClass("selected");

    switch($(el).html()) {
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
  }

  $(document).ready(function() {
    populateDefaultList();

    $(".display-option").click(function() {
      toggleVisibleStreamers($(this));
    });

    $(".stream-list-container").on('click', '.clear', function() {
      deleteStreamer($(this));
    });

    $(".stream-list-container").on("click",".sort-up-arrow",function() {
      swapStreamer($(this), DIRECTION.UP);
    });

    $(".stream-list-container").on("click",".sort-down-arrow",function() {
      swapStreamer($(this), DIRECTION.DOWN);
    });

    // Bring up "Add user menu".
    $(".add-stream").click(function() {
      $(".add-stream-overlay").fadeIn();
      $(".add-stream-menu").animate({"margin-top":"30vh"});
    });

    $(".add-stream-menu .clear").click(function() {
      closeMenu();
    });

    $("#submit").click(function() {
      addNewStreamer();
    });

    // Enable keyboard shortcuts for certain actions
    $('#new-streamer').keydown(function(e){
      var pressedKey = e.keyCode || e.which;

      if (pressedKey == 13) {
        addNewStreamer();
      } else if (pressedKey == 27) {
        closeMenu();
      }
    });
  });

}());