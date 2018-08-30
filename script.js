(function () {
  
  /** Array used to store tracked streamers */
  var trackedNames = ["vgbootcamp","ESL_SC2", "OgamingSC2", "cretetion", "freecodecamp", "storbeck", "habathcx", "RobotCaleb", "noobs2ninjas"];

  /**
  * Enum for arrow direction 
  * @readonly
  * @enum {String}
  */
  const DIRECTION = Object.freeze({
    UP: "DIRECTION_UP",
    DOWN: "DIRECTION_DOWN"
  });

  /**
  * Enum for streamer status 
  * @readonly
  * @enum {String}
  */
  const STREAMSTATUS = Object.freeze({
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE"
  });
  
  /**
  * Helper function used to create DOM elements
  * @param{String} tag - the tag to wrap the element with.
  * @param{String} className - The class to assign to the element.
  * @param{Object} attr - List of attributes to add to the element.
  * @param{String} content - The inner text.
  * @return {HTMLElement}
  */
  function createElement(tag, className, attr, content = null) {
    let el = document.createElement(tag);
    el.className = className;
    el.textContent = content;

    for (let key in attr) {
      if (attr.hasOwnProperty(key)) {
        el.setAttribute(key, attr[key]);
      }
    }

    return el;
  }

  /**
  * Helper function that links together a list of elements to a parent node.
  * @param{HTMLElement} parent - The parent element to attach to.
  * @param{HTMLElement[]} elements - An array of elements to attach.
  */
  function addElementsToParent(parent, elements) {
    elements.forEach(el => {
      parent.appendChild(el);
    });
  }

  /** Object used to consolidate streamer card functions */
  class streamerCard {
    /**
    * Constructor
    * @param{String} searchedName - The initial username that an user enters when searching.
    */
    constructor(searchedName) {
      this.displayName = searchedName;
      this.name = this.img = this.status = this.cardContainer = this.channelInfo = null;

      this.createCard();
    }

    /**
    * Creates the card's HTML elements */
    createCard() {
      this.cardContainer = createElement('div', 'twitch-container');

      let statusBar = createElement('div', 'status-bar');
      let clearBtn = createElement('div', 'clear');
      let upBtn = createElement('div', 'sort-up-arrow');
      let downBtn = createElement('div', 'sort-down-arrow');
      addElementsToParent(statusBar, [clearBtn, downBtn, upBtn]);

      this.img = createElement('img', 'stream-icon', {'src': 'https://www.placehold.it/300x300'});

      this.channelInfo = createElement('div', 'channel-info');
      this.name = createElement('div', 'stream-name', null, this.displayName);
      this.status = createElement('div', 'stream-status', null, 'Loading');

      addElementsToParent(this.channelInfo, [this.name, this.status]);
      addElementsToParent(this.cardContainer, [statusBar, this.img, this.channelInfo]);

      document.getElementById('stream-list-container').appendChild(this.cardContainer);
    }

    /**
    * Updates the streamer's display name to exactly match how they typed it.
    * @param{String} displayName - The new displayName to use.
    */
    setDisplayName(displayName) {
      this.name.textContent = displayName;
    }

    /**
    * Update the streamer's status
    * @param{StreamStatus} status - What the streamer's status is.
    * @param{String} statusText - The text to display as the streamer's status.
    */
    setStatus(status, statusText) {
      this.channelInfo.appendChild(createElement('a', 'stream-link', {'href': `https://www.twitch.tv/${this.displayName}`}, 'Visit Channel'));
      
      if (status === STREAMSTATUS.OFFLINE) {
        this.status.textContent = "Offline";
        this.cardContainer.classList.add("offline");
      } else if (status === STREAMSTATUS.ONLINE) {
        this.status.textContent = statusText;
        this.cardContainer.classList.add("active");
      }

    }

    /** Update streamer status text for channels that don't exist. */
    setChannelNull() {
      this.status.textContent = "Channel coming soon!";
    }

    /**
    * Update the streamer's icon.
    * @param{StreamStatus} imageURL - URL for streamer's icon.
    */
    setImage(imageUrl) {
      this.img.setAttribute('src', imageUrl);
    }
  }

  /**
  * Helper function to access Twitch API.
  * @param {String} username - The username to search for.
  * @param {String} type - Which database to search.
  * @return {String}
  */
  function GetURL(username,type) {
    return "https://wind-bow.gomix.me/twitch-api/"+type+"/"+username+"?callback=?";
  }

  /* Helper function to load default usernames at startup. */
  function populateDefaultList() {
    trackedNames.forEach(name => {
      GetStreamInfo(name);
    });
  }

  /*
  * Pull specified username data from Twitch API, and create info card. Needs to make two seperate calls due to the way that Twitch organizes their data.
  * @param{String} username - The username to search for.
  */
  function GetStreamInfo(username) {
    let streamerToAdd = new streamerCard(username);

    $.getJSON(GetURL(username,"users"), userData => {
      if (typeof userData.error === 'undefined') {
        streamerToAdd.setDisplayName(userData.display_name);
        streamerToAdd.setImage(userData.logo);
        $.getJSON(GetURL(username,"streams"), streamData => {
          if (streamData.stream) {
            streamerToAdd.setStatus(STREAMSTATUS.ONLINE, streamData.stream.channel.status);
          } else {
            streamerToAdd.setStatus(STREAMSTATUS.OFFLINE);
          }
        });
      } else {
        streamerToAdd.setChannelNull();
      }
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

  /**
  * Swap streamer card with the one immediately next to it.
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

  /**
  * Remove streamer from view and from trackedNames array
  * @param {jQuery} el - The jQuery element that called the function.
  */
  function deleteStreamer(el) {
    console.log('clicked!');
    var nameToRemove = $(el).parents(".twitch-container").find(".stream-name").text();
    trackedNames = trackedNames.splice(trackedNames.indexOf(nameToRemove),trackedNames.indexOf(nameToRemove) + 1);
    $(el).closest(".twitch-container").remove();
  }

  /**
  * Helper function used to close "add streamer" popup, and clears entered data*/
  function closeMenu() {
    $("#new-streamer").val("");
    $(".add-stream-menu .error").html("");
    $(".add-stream-overlay").fadeOut();
    $(".add-stream-menu").animate({"margin-top":"0"});
  }

  /**
  * Toggle which streamers are visible.
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

  $(document).ready(() => {
    populateDefaultList();

    $(".display-option").click(function() {
      toggleVisibleStreamers($(this));
    });

    $("#stream-list-container").on('click', '.clear', function() {
      deleteStreamer($(this));
    });

    $("#stream-list-container").on("click",".sort-up-arrow",function() {
      swapStreamer($(this), DIRECTION.UP);
    });

    $("#stream-list-container").on("click",".sort-down-arrow",function() {
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