(function () {

  /** Array used to store tracked streamers */
  let trackedStreamers = {};

  /**
  * Enum for arrow direction 
  * @readonly
  * @enum {String}
  */
  const DIRECTION = Object.freeze({
    UP: 'DIRECTION_UP',
    DOWN: 'DIRECTION_DOWN'
  });

  /**
  * Enum for streamer status 
  * @readonly
  * @enum {String}
  */
  const STREAMSTATUS = Object.freeze({
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE'
  });
  
  /** Helper function to shorten frequent document.getElementByID calls. */
  function getElById(id) {
    return document.getElementById(id);
  }

  /**
  * Helper function used to create DOM elements
  * @param{String} tag - the tag to wrap the element with.
  * @param{String} className - The class to assign to the element.
  * @param{Object} attr - List of attributes to add to the element.
  * @param{String} content - The inner text.
  * @return {HTMLElement}
  */
  function createElement(tag, className, attr = null, content = null) {
    let el = document.createElement(tag);
    el.className = className;
    el.textContent = content;
    
    if (attr) {
      Object.keys(attr).forEach(key => {
        el.setAttribute(key, attr[key]);
      });
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
  
  /**
  * Get requested data from API and unpack the recieved JSONP.  
  * @param {String} username - the username to search for.
  * @param {String} category - the category to search in.
  * @param {String} loadTime - An alloted amount of time before firing timeout.
  * @return {Promise}
  */
  function execJSONP(username, category, loadTime) {
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      let cb = 'exec'+Math.floor((Math.random()*65535)+1);
      script.async = true;
      script.src = `https://wind-bow.gomix.me/twitch-api/${category}/${username}?callback=${cb}`;
      script.id = cb;
      
      document.getElementsByTagName('head')[0].appendChild(script);
      
      let deleteSrc = () => {
        let scr = getElById(cb);
        scr.parentNode.removeChild(scr);
        window[cb] = null;
        delete window[cb];
      }

      let timeout = setTimeout(() => {
        reject('timed out');
        deleteSrc();
      }, loadTime);
      
      window[cb] = (data) => {
        resolve(data);
        clearTimeout(timeout);
        deleteSrc();
      }
    });
  }

  /** Object used to consolidate streamer card functions */
  class streamerCard {
    /**
    * Constructor
    * @param{String} searchedName - The initial username that an user enters when searching.
    */
    constructor(searchedName) {
      this.name = searchedName;
      
      this.nameContainer = this.imgContainer = this.statusContainer = this.cardContainer = this.channelInfoContainer = null;
      
      this.createCard();
    }

    /** Creates the card's HTML elements */
    createCard() {
      this.cardContainer = createElement('div', 'twitch-container', {'data-username': this.name});

      let statusBar = createElement('div', 'status-bar');
      let clearBtn = createElement('div', 'clear', {'data-action': 'delete-card'});
      let upBtn = createElement('div', 'sort-up-arrow', {'data-action': 'sort-up'});
      let downBtn = createElement('div', 'sort-down-arrow', {'data-action': 'sort-down'});
      addElementsToParent(statusBar, [clearBtn, downBtn, upBtn]);

      this.imgContainer = createElement('img', 'stream-icon', {'src': 'https://www.placehold.it/300x300'});

      this.channelInfoContainer = createElement('div', 'channel-info');
      this.nameContainer = createElement('div', 'stream-name', null, this.name);
      this.statusContainer = createElement('div', 'stream-status', null, 'Loading');

      addElementsToParent(this.channelInfoContainer, [this.nameContainer, this.statusContainer]);
      addElementsToParent(this.cardContainer, [statusBar, this.imgContainer, this.channelInfoContainer]);

      getElById('stream-list-container').appendChild(this.cardContainer);
      this.LoadStreamInfo();
    }

    /** Pull specified username data from Twitch API, and create info card. Needs to make two seperate calls due to the way that Twitch organizes their data. */
    LoadStreamInfo() {
      execJSONP(this.name, 'users', 3000)
        .then(userData => {
          if (typeof userData.error !== 'undefined') { throw 'Not a valid username' }
          this.setDisplayName(userData.display_name);
          this.setImage(userData.logo); })
        .then(() => execJSONP(this.name, 'streams', 3000))
        .then(streamData => {
          streamData.stream ? this.setStatus(STREAMSTATUS.ONLINE, streamData.stream.channel.status) : this.setStatus(STREAMSTATUS.OFFLINE); })
        .catch(() => this.setChannelNull());
    }

    /**
    * Updates the streamer's display name to exactly match how they typed it.
    * @param{String} displayName - The new displayName to use.
    */
    setDisplayName(displayName) {
      this.nameContainer.textContent = displayName;
    }

    /**
    * Update the streamer's status
    * @param{StreamStatus} status - What the streamer's status is.
    * @param{String} statusText - The text to display as the streamer's status.
    */
    setStatus(status, statusText) {
      this.channelInfoContainer.appendChild(createElement('a', 'stream-link', {'href': `https://www.twitch.tv/${this.name}`, 'target': '_blank'}, 'Visit Channel'));

      if (status === STREAMSTATUS.OFFLINE) {
        this.statusContainer.textContent = 'Offline';
        this.cardContainer.classList.add('offline');
      } else if (status === STREAMSTATUS.ONLINE) {
        this.statusContainer.textContent = statusText;
        this.cardContainer.classList.add('active');
      }

    }

    /** Update streamer status text for channels that don't exist. */
    setChannelNull() {
      this.statusContainer.textContent = 'Channel coming soon!';
    }

    /**
    * Update the streamer's icon.
    * @param{StreamStatus} imageURL - URL for streamer's icon.
    */
    setImage(imageUrl) {
      this.imgContainer.setAttribute('src', imageUrl);
    }
  }

  /**
  * Add new streamer to trackedStreamers array, if it matches requirements. 
  * @param {String} streamerToAdd - the username to begin tracking.
  */
  function addNewStreamer(streamerToAdd) {
    if (streamerToAdd in trackedStreamers) {
      getElById('add-streamer-error').innerHTML = 'This user is already being tracked!';
      return;
    }

    if (streamerToAdd.length < 4 || streamerToAdd.length > 25) {
      getElById('add-streamer-error').innerHTML = 'Username must be between 4 and 25 characters';
      return;
    }

    trackedStreamers[streamerToAdd] = new streamerCard(streamerToAdd);
    closeMenu();
  }

  /**
  * Swap streamer card with the one immediately next to it.
  * @param {HTMLElement} el - The element that called the function.
  * @param {String} type - The direction in which to move.
  */
  function swapStreamer(el, direction) {
    let item = el.closest('.twitch-container');
    if (direction === DIRECTION.UP) {
      if (item.previousSibling !== null) {
        getElById('stream-list-container').insertBefore(item, item.previousSibling);
      }
    } else if (direction === DIRECTION.DOWN) {
      if (item.nextElementSibling !== null) {
        getElById('stream-list-container').insertBefore(item.nextSibling, item);
      }
    }    
  }

  /**
  * Remove streamer from view and from trackedStreamers array
  * @param {HTMLElement} el - The element that called the function.
  */
  function deleteStreamer(el) {
    let parent = el.closest('.twitch-container');
    let username = parent.getAttribute('data-username');

    getElById('stream-list-container').removeChild(parent);
    delete trackedStreamers[username];
  }
  
  /**
  * Toggle which streamers are visible.
  * @param {HTMLElement} el - The element that called the function.
  */
  function toggleVisibleStreamers(el) {
    for (let button of document.getElementsByClassName('display-option')) {
      button.classList.remove('selected');
    }
    el.classList.add('selected');

    for (let card of document.getElementsByClassName('twitch-container')) {
      card.style.display = 'block';
    }

    let item = '';
    switch(el.getAttribute('data-select')) {
      case 'online': item = 'active'; break;
      case 'offline': item = 'offline'; break;
    }

    for (let card of document.getElementsByClassName(item)) {
      card.style.display = 'none';
    }
  }
  
  /**
  * Display the overlay, and animate its entry.
  */
  function displayAddStreamerMenu() {
    let overlay = getElById('add-stream-overlay');
    overlay.animate([{opacity: 0}, {opacity: 1}], {fill: 'forwards', duration: 800});
    overlay.style.display = 'block';
    
    getElById('add-stream-menu').animate([{top: 0}, {top: '50%'}], {fill: 'forwards', duration: 900, easing: 'ease-out'});
  }

  /**
  * Animate the overlay disappearing, then set display to hidden.
  */
  function closeMenu() {
    getElById('new-streamer').value = '';
    getElById('add-streamer-error').innerHTML = '';
    
    let overlay = getElById('add-stream-overlay');
    overlay.animate([{opacity: 1}, {opacity: 0}], {fill: 'forwards', duration: 500});
    setTimeout(() => overlay.style.display = 'none', 500);
    
    getElById('add-stream-menu').animate({'margin-top':'0'});
  }

  document.addEventListener('DOMContentLoaded',function(){
    let initialNames = ['vgbootcamp','ESL_SC2', 'OgamingSC2', 'cretetion', 'freecodecamp', 'storbeck', 'habathcx', 'RobotCaleb', 'noobs2ninjas'];
    initialNames.forEach(name => {
      addNewStreamer(name);
    });

    // Handle clicking on elements, especially dynamic ones that can't be attached to directly.
    document.addEventListener('click', function(e) {
      if (!e.target) { return; }

      switch(e.target.getAttribute('data-action')) {
        case 'delete-card': deleteStreamer(e.target); break;
        case 'select': toggleVisibleStreamers(e.target); break;
        case 'close-add-streamer-menu': e.preventDefault(); closeMenu(); break;
        case 'add-new-streamer': addNewStreamer(getElById('new-streamer').value); break;
        case 'display-add-menu': displayAddStreamerMenu(); break;
        case 'sort-up': swapStreamer(e.target, DIRECTION.UP); break;
        case 'sort-down': swapStreamer(e.target, DIRECTION.DOWN); break;
      }
    });
    
    // Enable keyboard shortcuts for certain actions
    document.addEventListener('keydown', function(e) {
      let pressedKey = e.keyCode || e.which;

      if (pressedKey == 13) {
        e.preventDefault();
        addNewStreamer(getElById('new-streamer').value);
      } else if (pressedKey == 27) {
        closeMenu();
      }
    });
  });

}());