(function() {
  var Bindata, Collection, Config, Main, MediainfoReader, Medialib, Playback, Playlist, Visualization, Xform;

  if (typeof xmmsclient === "undefined" || xmmsclient === null) {
    xmmsclient = require("./xmmsclient");
  }

  Main = (function() {

    Main.prototype.object_id = 1;

    function Main(client) {
      this.client = client;
    }

    Main.prototype.hello = function(protocol_version, client) {
      /* Says hello to the daemon.
      */
      var message;
      protocol_version = xmmsclient.Message.check_int(protocol_version);
      client = xmmsclient.Message.check_string(client);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [protocol_version, client];
      return this.client.send_message(message);
    };

    Main.prototype.quit = function() {
      /* Shuts down the daemon.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [];
      return this.client.send_message(message);
    };

    Main.prototype.list_plugins = function(plugin_type) {
      /* Retrieves the list of available plugins.
      */
      var message;
      plugin_type = xmmsclient.Message.check_int(plugin_type);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [plugin_type];
      return this.client.send_message(message);
    };

    Main.prototype.stats = function() {
      /* Retrieves statistics from the server.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [];
      return this.client.send_message(message);
    };

    Main.prototype.broadcast_quit = function() {
      /* This broadcast is triggered when the daemon is shutting down.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [12];
      return this.client.send_message(message);
    };

    return Main;

  })();

  xmmsclient.Client.IPC.Main = Main;

  Playlist = (function() {

    Playlist.prototype.object_id = 2;

    function Playlist(client) {
      this.client = client;
    }

    Playlist.prototype.shuffle = function(playlist) {
      /* Shuffles the current playlist.
      */
      var message;
      playlist = xmmsclient.Message.check_string(playlist);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [playlist];
      return this.client.send_message(message);
    };

    Playlist.prototype.set_next = function(position) {
      /* Sets the playlist entry that will be played next.
      */
      var message;
      position = xmmsclient.Message.check_int(position);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [position];
      return this.client.send_message(message);
    };

    Playlist.prototype.set_next_rel = function(position_delta) {
      /* Sets the playlist entry that will be played next.
      */
      var message;
      position_delta = xmmsclient.Message.check_int(position_delta);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [position_delta];
      return this.client.send_message(message);
    };

    Playlist.prototype.add_url = function(name, url) {
      /* Adds an URL to the given playlist.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [name, url];
      return this.client.send_message(message);
    };

    Playlist.prototype.add_id = function(playlist, id) {
      /* Adds a song to the given playlist.
      */
      var message;
      playlist = xmmsclient.Message.check_string(playlist);
      id = xmmsclient.Message.check_int(id);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 36;
      message.args = [playlist, id];
      return this.client.send_message(message);
    };

    Playlist.prototype.add_idlist = function(name, collection) {
      /* Adds songs to the given playlist.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      collection = xmmsclient.Message.check_collection(collection);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 37;
      message.args = [name, collection];
      return this.client.send_message(message);
    };

    Playlist.prototype.add_collection = function(name, collection, order) {
      /* Adds the contents of a collection to the given playlist.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      collection = xmmsclient.Message.check_collection(collection);
      order = xmmsclient.Message.check_list(order, "string");
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 38;
      message.args = [name, collection, order];
      return this.client.send_message(message);
    };

    Playlist.prototype.remove_entry = function(playlist, position) {
      /* Removes an entry from the given playlist.
      */
      var message;
      playlist = xmmsclient.Message.check_string(playlist);
      position = xmmsclient.Message.check_int(position);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 39;
      message.args = [playlist, position];
      return this.client.send_message(message);
    };

    Playlist.prototype.move_entry = function(playlist, current_position, new_position) {
      /* Moves a playlist entry to a new position (absolute move).
      */
      var message;
      playlist = xmmsclient.Message.check_string(playlist);
      current_position = xmmsclient.Message.check_int(current_position);
      new_position = xmmsclient.Message.check_int(new_position);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 40;
      message.args = [playlist, current_position, new_position];
      return this.client.send_message(message);
    };

    Playlist.prototype.clear = function(playlist) {
      /* Removes all songs from the given playlist.
      */
      var message;
      playlist = xmmsclient.Message.check_string(playlist);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 41;
      message.args = [playlist];
      return this.client.send_message(message);
    };

    Playlist.prototype.sort = function(playlist, properties) {
      /* Sorts the given playlist by the given properties.
      */
      var message;
      playlist = xmmsclient.Message.check_string(playlist);
      properties = xmmsclient.Message.check_list(properties, "string");
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 42;
      message.args = [playlist, properties];
      return this.client.send_message(message);
    };

    Playlist.prototype.list_entries = function(name) {
      /* Lists the contents of the given playlist.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 43;
      message.args = [name];
      return this.client.send_message(message);
    };

    Playlist.prototype.current_pos = function(name) {
      /* Retrieves the current position in the playlist with the given name.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 44;
      message.args = [name];
      return this.client.send_message(message);
    };

    Playlist.prototype.current_active = function() {
      /* Retrieves the name of the currently active playlist.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 45;
      message.args = [];
      return this.client.send_message(message);
    };

    Playlist.prototype.insert_url = function(name, position, url) {
      /* Inserts an URL into the given playlist.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      position = xmmsclient.Message.check_int(position);
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 46;
      message.args = [name, position, url];
      return this.client.send_message(message);
    };

    Playlist.prototype.insert_id = function(name, position, entry) {
      /* Inserts a song into the given playlist.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      position = xmmsclient.Message.check_int(position);
      entry = xmmsclient.Message.check_int(entry);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 47;
      message.args = [name, position, entry];
      return this.client.send_message(message);
    };

    Playlist.prototype.insert_collection = function(name, position, collection, order) {
      /* Inserts the contents of a collection into the given playlist.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      position = xmmsclient.Message.check_int(position);
      collection = xmmsclient.Message.check_collection(collection);
      order = xmmsclient.Message.check_list(order, "string");
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 48;
      message.args = [name, position, collection, order];
      return this.client.send_message(message);
    };

    Playlist.prototype.load = function(name) {
      /* Loads the playlist with the given name.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 49;
      message.args = [name];
      return this.client.send_message(message);
    };

    Playlist.prototype.radd = function(name, url) {
      /* Adds a directory recursively to the playlist with the given name.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 50;
      message.args = [name, url];
      return this.client.send_message(message);
    };

    Playlist.prototype.rinsert = function(name, position, url) {
      /* Insert a directory recursively into the playlist with the given name at the given position.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      position = xmmsclient.Message.check_int(position);
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 51;
      message.args = [name, position, url];
      return this.client.send_message(message);
    };

    Playlist.prototype.broadcast_playlist_changed = function() {
      /* This broadcast is triggered when the playlist changes.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [0];
      return this.client.send_message(message);
    };

    Playlist.prototype.broadcast_current_pos = function() {
      /* This broadcast is triggered when the position in the playlist changes.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [6];
      return this.client.send_message(message);
    };

    Playlist.prototype.broadcast_loaded = function() {
      /* This broadcast is triggered when another playlist is loaded.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [7];
      return this.client.send_message(message);
    };

    return Playlist;

  })();

  xmmsclient.Client.IPC.Playlist = Playlist;

  Config = (function() {

    Config.prototype.object_id = 3;

    function Config(client) {
      this.client = client;
    }

    Config.prototype.get_value = function(key) {
      /* Retrieves the value of the config property with the given key.
      */
      var message;
      key = xmmsclient.Message.check_string(key);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [key];
      return this.client.send_message(message);
    };

    Config.prototype.set_value = function(key, value) {
      /* Sets the value of the config property with the given key.
      */
      var message;
      key = xmmsclient.Message.check_string(key);
      value = xmmsclient.Message.check_string(value);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [key, value];
      return this.client.send_message(message);
    };

    Config.prototype.register_value = function(key, value) {
      /* Registers a new config property for the connected client.
      */
      var message;
      key = xmmsclient.Message.check_string(key);
      value = xmmsclient.Message.check_string(value);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [key, value];
      return this.client.send_message(message);
    };

    Config.prototype.list_values = function() {
      /* Retrieves the list of known config properties.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [];
      return this.client.send_message(message);
    };

    Config.prototype.broadcast_value_changed = function() {
      /* This broadcast is triggered when the value of any config property changes.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [1];
      return this.client.send_message(message);
    };

    return Config;

  })();

  xmmsclient.Client.IPC.Config = Config;

  Playback = (function() {

    Playback.prototype.object_id = 4;

    function Playback(client) {
      this.client = client;
    }

    Playback.prototype.start = function() {
      /* Starts playback.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.stop = function() {
      /* Stops playback.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.pause = function() {
      /* Pauses playback.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.tickle = function() {
      /* Stops decoding of the current song. This will start decoding of the song set with the playlist_set_next command or the current song again if the playlist_set_next command wasn't executed.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.playtime = function() {
      /* Retrieves the current playtime.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 36;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.seek_ms = function(offset_milliseconds, whence) {
      /* Seeks to a position in the currently played song (given in milliseconds).
      */
      var message;
      offset_milliseconds = xmmsclient.Message.check_int(offset_milliseconds);
      whence = xmmsclient.Message.check_int(whence);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 37;
      message.args = [offset_milliseconds, whence];
      return this.client.send_message(message);
    };

    Playback.prototype.seek_samples = function(offset_samples, whence) {
      /* Seeks to a position in the currently played song (given in samples).
      */
      var message;
      offset_samples = xmmsclient.Message.check_int(offset_samples);
      whence = xmmsclient.Message.check_int(whence);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 38;
      message.args = [offset_samples, whence];
      return this.client.send_message(message);
    };

    Playback.prototype.status = function() {
      /* Retrieves the current playback status.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 39;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.current_id = function() {
      /* Retrieves the ID of the song that's currently being played.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 40;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.volume_set = function(channel, volume) {
      /* Changes the volume for the given channel.
      */
      var message;
      channel = xmmsclient.Message.check_string(channel);
      volume = xmmsclient.Message.check_int(volume);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 41;
      message.args = [channel, volume];
      return this.client.send_message(message);
    };

    Playback.prototype.volume_get = function() {
      /* Retrieves the volume for all available channel.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 42;
      message.args = [];
      return this.client.send_message(message);
    };

    Playback.prototype.signal_playtime = function() {
      /* Emits the current playtime.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 32;
      message.args = [4];
      return this.client.send_signal_message(message, 4);
    };

    Playback.prototype.broadcast_status = function() {
      /* This broadcast is triggered when the playback status changes.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [2];
      return this.client.send_message(message);
    };

    Playback.prototype.broadcast_volume_changed = function() {
      /* This broadcast is triggered when the playback volume changes.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [3];
      return this.client.send_message(message);
    };

    Playback.prototype.broadcast_current_id = function() {
      /* This broadcast is triggered when the played song's media ID changes.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [5];
      return this.client.send_message(message);
    };

    return Playback;

  })();

  xmmsclient.Client.IPC.Playback = Playback;

  Medialib = (function() {

    Medialib.prototype.object_id = 5;

    function Medialib(client) {
      this.client = client;
    }

    Medialib.prototype.get_info = function(id) {
      /* Retrieves information about a medialib entry.
      */
      var message;
      id = xmmsclient.Message.check_int(id);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [id];
      return this.client.send_message(message);
    };

    Medialib.prototype.import_path = function(directory) {
      /* Adds a directory recursively to the medialib.
      */
      var message;
      directory = xmmsclient.Message.check_string(directory);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [directory];
      return this.client.send_message(message);
    };

    Medialib.prototype.rehash = function(id) {
      /* Rehashes the medialib. This will make sure that the data in the medialib is the same as the data in the files.
      */
      var message;
      id = xmmsclient.Message.check_int(id);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [id];
      return this.client.send_message(message);
    };

    Medialib.prototype.get_id = function(url) {
      /* Retrieves the medialib ID that belongs to the given URL.
      */
      var message;
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [url];
      return this.client.send_message(message);
    };

    Medialib.prototype.remove_entry = function(entry) {
      /* Removes an entry from the medialib.
      */
      var message;
      entry = xmmsclient.Message.check_int(entry);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 36;
      message.args = [entry];
      return this.client.send_message(message);
    };

    Medialib.prototype.set_property_string = function(entry, source, key, value) {
      /* Sets a medialib property to a string value.
      */
      var message;
      entry = xmmsclient.Message.check_int(entry);
      source = xmmsclient.Message.check_string(source);
      key = xmmsclient.Message.check_string(key);
      value = xmmsclient.Message.check_string(value);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 37;
      message.args = [entry, source, key, value];
      return this.client.send_message(message);
    };

    Medialib.prototype.set_property_int = function(entry, source, key, value) {
      /* Sets a medialib property to an integer value.
      */
      var message;
      entry = xmmsclient.Message.check_int(entry);
      source = xmmsclient.Message.check_string(source);
      key = xmmsclient.Message.check_string(key);
      value = xmmsclient.Message.check_int(value);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 38;
      message.args = [entry, source, key, value];
      return this.client.send_message(message);
    };

    Medialib.prototype.remove_property = function(entry, source, key) {
      /* Removes a propert from a medialib entry.
      */
      var message;
      entry = xmmsclient.Message.check_int(entry);
      source = xmmsclient.Message.check_string(source);
      key = xmmsclient.Message.check_string(key);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 39;
      message.args = [entry, source, key];
      return this.client.send_message(message);
    };

    Medialib.prototype.move_entry = function(entry, url) {
      /* Updates the URL of a medialib entry that has been moved to a new location.
      */
      var message;
      entry = xmmsclient.Message.check_int(entry);
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 40;
      message.args = [entry, url];
      return this.client.send_message(message);
    };

    Medialib.prototype.add_entry = function(url) {
      /* Add the given URL to the medialib.
      */
      var message;
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 41;
      message.args = [url];
      return this.client.send_message(message);
    };

    Medialib.prototype.broadcast_entry_added = function() {
      /* This broadcast is triggered when an entry is added to the medialib.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [8];
      return this.client.send_message(message);
    };

    Medialib.prototype.broadcast_entry_changed = function() {
      /* This broadcast is triggered when the properties of a medialib entry are changed.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [9];
      return this.client.send_message(message);
    };

    Medialib.prototype.broadcast_entry_removed = function() {
      /* This broadcast is triggered when a medialib entry is removed.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [10];
      return this.client.send_message(message);
    };

    return Medialib;

  })();

  xmmsclient.Client.IPC.Medialib = Medialib;

  Collection = (function() {

    Collection.prototype.object_id = 6;

    function Collection(client) {
      this.client = client;
    }

    Collection.prototype.get = function(name, name_space) {
      /* Retrieves the structure of a given collection.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      name_space = xmmsclient.Message.check_string(name_space);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [name, name_space];
      return this.client.send_message(message);
    };

    Collection.prototype.list = function(name_space) {
      /* Lists the collections in the given namespace.
      */
      var message;
      name_space = xmmsclient.Message.check_string(name_space);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [name_space];
      return this.client.send_message(message);
    };

    Collection.prototype.save = function(name, name_space, collection) {
      /* Save the given collection in the DAG under the given name in the given namespace.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      name_space = xmmsclient.Message.check_string(name_space);
      collection = xmmsclient.Message.check_collection(collection);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [name, name_space, collection];
      return this.client.send_message(message);
    };

    Collection.prototype.remove = function(name, name_space) {
      /* Remove the given collection from the DAG.
      */
      var message;
      name = xmmsclient.Message.check_string(name);
      name_space = xmmsclient.Message.check_string(name_space);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [name, name_space];
      return this.client.send_message(message);
    };

    Collection.prototype.find = function(entry, name_space) {
      /* Find all collections in the given namespace that contain a given media.
      */
      var message;
      entry = xmmsclient.Message.check_int(entry);
      name_space = xmmsclient.Message.check_string(name_space);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 36;
      message.args = [entry, name_space];
      return this.client.send_message(message);
    };

    Collection.prototype.rename = function(original_name, new_name, name_space) {
      /* Rename a collection in the given namespace.
      */
      var message;
      original_name = xmmsclient.Message.check_string(original_name);
      new_name = xmmsclient.Message.check_string(new_name);
      name_space = xmmsclient.Message.check_string(name_space);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 37;
      message.args = [original_name, new_name, name_space];
      return this.client.send_message(message);
    };

    Collection.prototype.query = function(collection, fetch) {
      /* FIXME.
      */
      var message;
      collection = xmmsclient.Message.check_collection(collection);
      fetch = xmmsclient.Message.check_dictionary(fetch);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 38;
      message.args = [collection, fetch];
      return this.client.send_message(message);
    };

    Collection.prototype.query_infos = function(collection, lim_start, lim_len, order, fetch, group) {
      /* FIXME.
      */
      var message;
      collection = xmmsclient.Message.check_collection(collection);
      lim_start = xmmsclient.Message.check_int(lim_start);
      lim_len = xmmsclient.Message.check_int(lim_len);
      order = xmmsclient.Message.check_list(order, "string");
      fetch = xmmsclient.Message.check_list(fetch, "string");
      group = xmmsclient.Message.check_list(group, "string");
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 39;
      message.args = [collection, lim_start, lim_len, order, fetch, group];
      return this.client.send_message(message);
    };

    Collection.prototype.idlist_from_playlist = function(path) {
      /* FIXME.
      */
      var message;
      path = xmmsclient.Message.check_string(path);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 40;
      message.args = [path];
      return this.client.send_message(message);
    };

    Collection.prototype.sync = function() {
      /* FIXME.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 41;
      message.args = [];
      return this.client.send_message(message);
    };

    Collection.prototype.broadcast_changed = function() {
      /* This broadcast is triggered when a collection is changed.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [11];
      return this.client.send_message(message);
    };

    return Collection;

  })();

  xmmsclient.Client.IPC.Collection = Collection;

  Visualization = (function() {

    Visualization.prototype.object_id = 7;

    function Visualization(client) {
      this.client = client;
    }

    Visualization.prototype.query_version = function() {
      /* Retrieves the visualization version.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [];
      return this.client.send_message(message);
    };

    Visualization.prototype.register = function() {
      /* Registers a visualization client.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [];
      return this.client.send_message(message);
    };

    Visualization.prototype.init_shm = function(id, shm_id) {
      /* FIXME.
      */
      var message;
      id = xmmsclient.Message.check_int(id);
      shm_id = xmmsclient.Message.check_string(shm_id);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [id, shm_id];
      return this.client.send_message(message);
    };

    Visualization.prototype.init_udp = function(id) {
      /* FIXME.
      */
      var message;
      id = xmmsclient.Message.check_int(id);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [id];
      return this.client.send_message(message);
    };

    Visualization.prototype.set_property = function(id, key, value) {
      /* Delivers one property.
      */
      var message;
      id = xmmsclient.Message.check_int(id);
      key = xmmsclient.Message.check_string(key);
      value = xmmsclient.Message.check_string(value);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 36;
      message.args = [id, key, value];
      return this.client.send_message(message);
    };

    Visualization.prototype.set_properties = function(id, properties) {
      /* Delivers one or more properties.
      */
      var message;
      id = xmmsclient.Message.check_int(id);
      properties = xmmsclient.Message.check_dictionary(properties, "string");
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 37;
      message.args = [id, properties];
      return this.client.send_message(message);
    };

    Visualization.prototype.shutdown = function(id) {
      /* Shuts down the visualization client.
      */
      var message;
      id = xmmsclient.Message.check_int(id);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 38;
      message.args = [id];
      return this.client.send_message(message);
    };

    return Visualization;

  })();

  xmmsclient.Client.IPC.Visualization = Visualization;

  MediainfoReader = (function() {

    MediainfoReader.prototype.object_id = 8;

    function MediainfoReader(client) {
      this.client = client;
    }

    MediainfoReader.prototype.signal_unindexed = function() {
      /* Emits the number of unresolved medialib entries.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 32;
      message.args = [14];
      return this.client.send_signal_message(message, 14);
    };

    MediainfoReader.prototype.broadcast_status = function() {
      /* This broadcast is triggered when the status of the mediainfo reader changes.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = 0;
      message.command_id = 33;
      message.args = [13];
      return this.client.send_message(message);
    };

    return MediainfoReader;

  })();

  xmmsclient.Client.IPC.MediainfoReader = MediainfoReader;

  Xform = (function() {

    Xform.prototype.object_id = 9;

    function Xform(client) {
      this.client = client;
    }

    Xform.prototype.browse = function(url) {
      /* Retrieves a list of paths available (directly) under the given path.
      */
      var message;
      url = xmmsclient.Message.check_string(url);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [url];
      return this.client.send_message(message);
    };

    return Xform;

  })();

  xmmsclient.Client.IPC.Xform = Xform;

  Bindata = (function() {

    Bindata.prototype.object_id = 10;

    function Bindata(client) {
      this.client = client;
    }

    Bindata.prototype.retrieve = function(hash) {
      /* Retrieves a file from the server's bindata directory given the file's hash.
      */
      var message;
      hash = xmmsclient.Message.check_string(hash);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 32;
      message.args = [hash];
      return this.client.send_message(message);
    };

    Bindata.prototype.add = function(raw_data) {
      /* Adds binary data to the server's bindata directory.
      */
      var message;
      raw_data = xmmsclient.Message.check_binary(raw_data);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 33;
      message.args = [raw_data];
      return this.client.send_message(message);
    };

    Bindata.prototype.remove = function(hash) {
      /* Removes binary data from the server's bindata directory.
      */
      var message;
      hash = xmmsclient.Message.check_string(hash);
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 34;
      message.args = [hash];
      return this.client.send_message(message);
    };

    Bindata.prototype.list = function() {
      /* Retrieves a list of binary data hashes from the server's bindata directory.
      */
      var message;
      message = new xmmsclient.Message();
      message.object_id = this.object_id;
      message.command_id = 35;
      message.args = [];
      return this.client.send_message(message);
    };

    return Bindata;

  })();

  xmmsclient.Client.IPC.Bindata = Bindata;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = xmmsclient;
  }

}).call(this);
