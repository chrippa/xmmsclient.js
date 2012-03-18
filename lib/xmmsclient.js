(function() {
  var ActivePlaylist, Bindata, Client, Collection, CollectionChanged, CollectionNamespace, Error, MediainfoReaderStatus, MedialibEntryStatus, Message, PlaybackStatus, PlaylistChange, PluginType, PropDict, Result, Seek, Util, Value, net, url, xmmsclient,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof process === "object") {
    net = require("net");
    url = require("url");
  } else {
    this.WebSocket = (typeof MozWebSocket !== "undefined" && MozWebSocket !== null) && MozWebSocket || (typeof WebSocket !== "undefined" && WebSocket !== null) && WebSocket;
  }

  Util = (function() {

    function Util() {}

    Util.debug_on = false;

    Util.debug = function() {
      if (this.debug_on) return console.log(arguments);
    };

    Util.encode_utf8 = function(str) {
      return unescape(encodeURIComponent(str));
    };

    Util.decode_utf8 = function(str) {
      return decodeURIComponent(escape(str));
    };

    Util.dump_buffer = function(data) {
      var i, list, _ref;
      list = [];
      for (i = 0, _ref = data.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        list[i] = data.charCodeAt(i);
      }
      return list;
    };

    return Util;

  })();

  Message = (function() {

    Message.check_int = function(val) {
      if (typeof val !== "number") {
        throw new TypeError("Invalid argument, expected number");
      }
      if (val > 0x7fffffff || val < -0x80000000) {
        throw new TypeError("Invalid argument, number is out of range");
      }
      return val;
    };

    Message.check_binary = function(val) {
      if (!(val instanceof Bindata)) {
        throw new TypeError("Invalid argument, expected bindata");
      }
      return val;
    };

    Message.check_string = function(val) {
      if (!(val && val.toString)) {
        throw new TypeError("Invalid argument, expected string");
      }
      return val.toString();
    };

    Message.check_list = function(val, subtype) {
      var value, _i, _len;
      if (!Array.isArray(val)) {
        throw new TypeError("Invalid argument, expected list");
      }
      for (_i = 0, _len = val.length; _i < _len; _i++) {
        value = val[_i];
        if (typeof value !== subtype) {
          throw new TypeError("Invalid value in list, expected " + subtype);
        }
      }
      return val;
    };

    Message.check_dictionary = function(val, subtype) {
      var key, value;
      if (typeof val !== "object") {
        throw new TypeError("Invalid argument, expected dictionary");
      }
      for (key in val) {
        value = val[key];
        if (subtype) {
          if (typeof value !== subtype) {
            throw new TypeError("Invalid value in dict, expected " + subtype);
          }
        }
      }
      return val;
    };

    Message.check_collection = function(val) {
      if (!(val instanceof Collection)) {
        throw new TypeError("Invalid argument, expected collection");
      }
      return val;
    };

    function Message() {
      this.object_id = null;
      this.command_id = null;
      this.cookie = null;
      this.payload = new Bindata();
      this.payload_length = 0;
      this.args = [];
    }

    Message.prototype.assemble = function(cookie) {
      var header, payload;
      payload = new Bindata();
      Value.serialize(payload, this.args);
      header = new Bindata();
      header.write_int(this.object_id);
      header.write_int(this.command_id);
      header.write_int(cookie);
      header.write_int(payload.data.length);
      return header.data + payload.data;
    };

    return Message;

  })();

  Value = (function() {

    function Value() {}

    Value.Type = {
      None: 0x00,
      Error: 0x01,
      Integer: 0x02,
      String: 0x03,
      Collection: 0x04,
      Binary: 0x05,
      List: 0x06,
      Dictionary: 0x07
    };

    Value.serialize = function(bindata, val) {
      var coll, i, key, length, n, value, _i, _j, _len, _len2, _len3, _ref, _ref2, _ref3, _results, _results2, _results3;
      switch (typeof val) {
        case "string":
          bindata.write_int(this.Type.String);
          return bindata.write_string(val);
        case "number":
          bindata.write_int(this.Type.Integer);
          return bindata.write_int(val);
        case "object":
          if (Array.isArray(val)) {
            bindata.write_int(this.Type.List);
            bindata.write_int(val.length);
            _results = [];
            for (i = 0, _len = val.length; i < _len; i++) {
              value = val[i];
              _results.push(Value.serialize(bindata, value));
            }
            return _results;
          } else if (val instanceof Bindata) {
            bindata.write_int(this.Type.Binary);
            bindata.write_int(val.data.length);
            return bindata.write_data(val.data);
          } else if (val instanceof Collection) {
            bindata.write_int(this.Type.Collection);
            bindata.write_int(val.type);
            length = 0;
            for (key in val.attributes) {
              length += 1;
            }
            bindata.write_int(length);
            _ref = val.attributes;
            for (key in _ref) {
              value = _ref[key];
              bindata.write_string(key);
              bindata.write_string(value);
            }
            bindata.write_int(val.idlist.length);
            _ref2 = val.idlist;
            for (_i = 0, _len2 = _ref2.length; _i < _len2; _i++) {
              value = _ref2[_i];
              bindata.write_int(value);
            }
            n = val.type !== val.Type.Reference ? val.operands.length : 0;
            bindata.write_int(n);
            if (n > 0) {
              _ref3 = val.operands;
              _results2 = [];
              for (_j = 0, _len3 = _ref3.length; _j < _len3; _j++) {
                coll = _ref3[_j];
                _results2.push(Value.serialize(bindata, coll));
              }
              return _results2;
            }
          } else {
            bindata.write_int(this.Type.Dictionary);
            length = 0;
            for (key in val) {
              length += 1;
            }
            bindata.write_int(length);
            _results3 = [];
            for (key in val) {
              value = val[key];
              bindata.write_string(key);
              _results3.push(Value.serialize(bindata, value));
            }
            return _results3;
          }
      }
    };

    Value.deserialize = function(bindata) {
      var coll, dict, i, key, length, list, type, val, value;
      type = bindata.read_int();
      switch (type) {
        case Value.Type.None:
          return null;
        case Value.Type.Error:
          return new Error(bindata.read_string());
        case Value.Type.Integer:
          val = bindata.read_int();
          return val;
        case Value.Type.String:
          return bindata.read_string();
        case Value.Type.Binary:
          length = bindata.read_int();
          return new Bindata(bindata.read_data(length));
        case Value.Type.Collection:
          type = bindata.read_int();
          coll = new Collection(type);
          length = bindata.read_int();
          for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
            key = bindata.read_string();
            value = bindata.read_string();
            coll.attributes[key] = value;
          }
          length = bindata.read_int();
          for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
            value = bindata.read_int();
            coll.idlist.push(value);
          }
          length = bindata.read_int();
          for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
            value = Value.deserialize(bindata);
            coll.operands.push(value);
          }
          return coll;
        case Value.Type.List:
          length = bindata.read_int();
          list = [];
          for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
            list[i] = Value.deserialize(bindata);
          }
          return list;
        case Value.Type.Dictionary:
          length = bindata.read_int();
          dict = {};
          for (i = 0; 0 <= length ? i < length : i > length; 0 <= length ? i++ : i--) {
            key = bindata.read_string();
            value = Value.deserialize(bindata);
            dict[key] = value;
          }
          return dict;
      }
    };

    return Value;

  })();

  Result = (function() {

    function Result(cookie) {
      this.cookie = cookie;
      this.is_signal = false;
      this.is_broadcast = false;
      this.onvalue = null;
      this.value = null;
    }

    return Result;

  })();

  Collection = (function() {
    var List, Operand;

    Collection.prototype.Type = {
      Reference: 0,
      Universe: 1,
      Union: 2,
      Intersection: 3,
      Complement: 4,
      Has: 5,
      Match: 6,
      Token: 7,
      Equals: 8,
      NotEqual: 9,
      Smaller: 10,
      SmallerEq: 11,
      Greater: 12,
      GreaterEq: 13,
      Order: 14,
      Limit: 15,
      MediaSet: 16,
      IDList: 17
    };

    function Collection(type) {
      this.type = type;
      this.reset();
    }

    Collection.prototype.reset = function() {
      this.attributes = {};
      this.operands = [];
      return this.idlist = [];
    };

    Collection.Universe = (function(_super) {

      __extends(Universe, _super);

      function Universe() {
        Universe.__super__.constructor.call(this, this.Type.Universe);
      }

      return Universe;

    })(Collection);

    List = (function(_super) {

      __extends(List, _super);

      function List(type, list, operands) {
        var item, operand, _i, _j, _len, _len2;
        if (type == null) type = "list";
        if (list == null) list = [];
        if (operands == null) operands = [];
        List.__super__.constructor.call(this, this.Type.IDList);
        this.attributes.type = type;
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          item = list[_i];
          this.idlist.push(item);
        }
        for (_j = 0, _len2 = operands.length; _j < _len2; _j++) {
          operand = operands[_j];
          this.operands.push(operand);
        }
      }

      return List;

    })(Collection);

    Collection.IDList = (function(_super) {

      __extends(IDList, _super);

      function IDList(list, operands) {
        IDList.__super__.constructor.call(this, "list", list, operands);
      }

      return IDList;

    })(List);

    Collection.Queue = (function(_super) {

      __extends(Queue, _super);

      function Queue(list, operands) {
        Queue.__super__.constructor.call(this, "queue", list, operands);
      }

      return Queue;

    })(List);

    Collection.PartyShuffle = (function(_super) {

      __extends(PartyShuffle, _super);

      function PartyShuffle() {
        PartyShuffle.__super__.constructor.apply(this, arguments);
      }

      PartyShuffle.prototype.contructor = function(list, operands) {
        if (operands == null) operands = [new Collection.Universe()];
        return PartyShuffle.__super__.contructor.call(this, "pshuffle", list, operands);
      };

      return PartyShuffle;

    })(List);

    Collection.Reference = (function(_super) {

      __extends(Reference, _super);

      function Reference(ref, ns) {
        if (ns == null) ns = "Collections";
        Reference.__super__.constructor.call(this, this.Type.Reference);
        this.attributes["reference"] = ref;
        this.attributes["namespace"] = ns;
      }

      return Reference;

    })(Collection);

    Collection.Complement = (function(_super) {

      __extends(Complement, _super);

      function Complement(operand) {
        Complement.__super__.constructor.call(this, this.Type.Complement);
        if (operand) this.operands.push(operand);
      }

      return Complement;

    })(Collection);

    Collection.Intersection = (function(_super) {

      __extends(Intersection, _super);

      function Intersection(operands) {
        var operand, _i, _len;
        if (operands == null) operands = [];
        Intersection.__super__.constructor.call(this, this.Type.Intersection);
        for (_i = 0, _len = operands.length; _i < _len; _i++) {
          operand = operands[_i];
          this.operands.push(operand);
        }
      }

      return Intersection;

    })(Collection);

    Collection.Union = (function(_super) {

      __extends(Union, _super);

      function Union(operands) {
        var operand, _i, _len;
        if (operands == null) operands = [];
        Union.__super__.constructor.call(this, this.Type.Union);
        for (_i = 0, _len = operands.length; _i < _len; _i++) {
          operand = operands[_i];
          this.operands.push(operand);
        }
      }

      return Union;

    })(Collection);

    Operand = (function(_super) {

      __extends(Operand, _super);

      function Operand(type, parent, attr) {
        var key, value;
        if (parent == null) parent = new Collection.Universe();
        Operand.__super__.constructor.call(this, type);
        for (key in attr) {
          value = attr[key];
          this.attributes[key] = value;
        }
        this.operands.push(parent);
      }

      return Operand;

    })(Collection);

    Collection.Has = (function(_super) {

      __extends(Has, _super);

      function Has(parent, attr) {
        Has.__super__.constructor.call(this, this.Type.Has, parent, attr);
      }

      return Has;

    })(Operand);

    Collection.Match = (function(_super) {

      __extends(Match, _super);

      function Match(parent, attr) {
        Match.__super__.constructor.call(this, this.Type.Match, parent, attr);
      }

      return Match;

    })(Operand);

    Collection.Token = (function(_super) {

      __extends(Token, _super);

      function Token(parent, attr) {
        Token.__super__.constructor.call(this, this.Type.Token, parent, attr);
      }

      return Token;

    })(Operand);

    Collection.Equals = (function(_super) {

      __extends(Equals, _super);

      function Equals(parent, attr) {
        Equals.__super__.constructor.call(this, this.Type.Equals, parent, attr);
      }

      return Equals;

    })(Operand);

    Collection.NotEqual = (function(_super) {

      __extends(NotEqual, _super);

      function NotEqual(parent, attr) {
        NotEqual.__super__.constructor.call(this, this.Type.NotEqual, parent, attr);
      }

      return NotEqual;

    })(Operand);

    Collection.Smaller = (function(_super) {

      __extends(Smaller, _super);

      function Smaller(parent, attr) {
        Smaller.__super__.constructor.call(this, this.Type.Smaller, parent, attr);
      }

      return Smaller;

    })(Operand);

    Collection.SmallerEqual = (function(_super) {

      __extends(SmallerEqual, _super);

      function SmallerEqual(parent, attr) {
        SmallerEqual.__super__.constructor.call(this, this.Type.SmallerEq, parent, attr);
      }

      return SmallerEqual;

    })(Operand);

    Collection.Greater = (function(_super) {

      __extends(Greater, _super);

      function Greater(parent, attr) {
        Greater.__super__.constructor.call(this, this.Type.Greater, parent, attr);
      }

      return Greater;

    })(Operand);

    Collection.GreaterEqual = (function(_super) {

      __extends(GreaterEqual, _super);

      function GreaterEqual(parent, attr) {
        GreaterEqual.__super__.constructor.call(this, this.Type.GreaterEq, parent, attr);
      }

      return GreaterEqual;

    })(Operand);

    Collection.Order = (function(_super) {

      __extends(Order, _super);

      function Order(parent, attr) {
        Order.__super__.constructor.call(this, this.Type.Order, parent, attr);
      }

      return Order;

    })(Operand);

    Collection.Limit = (function(_super) {

      __extends(Limit, _super);

      function Limit(parent, start, length) {
        Limit.__super__.constructor.call(this, this.Type.Limit, parent, {
          start: start,
          length: length
        });
      }

      return Limit;

    })(Operand);

    Collection.Mediaset = (function(_super) {

      __extends(Mediaset, _super);

      function Mediaset(parent, attr) {
        Mediaset.__super__.constructor.call(this, this.Type.Mediaset, parent, attr);
      }

      return Mediaset;

    })(Operand);

    return Collection;

  })();

  PropDict = (function() {

    PropDict.default_source_prefs = ["server", "client/*", "plugin/id3v2", "plugin/segment", "plugin/*", "*"];

    PropDict.flatten = function(dict, source_prefs) {
      var propdict;
      propdict = new PropDict(source_prefs);
      return propdict.transform(dict);
    };

    function PropDict(source_prefs) {
      this.source_prefs = source_prefs != null ? source_prefs : PropDict.default_source_prefs;
    }

    PropDict.prototype.transform = function(dict) {
      var index, inner_dict, inner_key, key, lowest, newdict;
      newdict = {};
      for (key in dict) {
        inner_dict = dict[key];
        lowest = this.source_prefs.length + 1;
        for (inner_key in inner_dict) {
          index = this.find_matching_pattern(inner_key);
          if (index < lowest) {
            newdict[key] = inner_dict[inner_key];
            lowest = index;
          }
        }
      }
      return newdict;
    };

    PropDict.prototype.find_matching_pattern = function(key) {
      var i, pattern, _len, _ref;
      _ref = this.source_prefs;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pattern = _ref[i];
        if (this.source_match_pattern(key, pattern)) return i;
      }
    };

    PropDict.prototype.source_match_pattern = function(source, pattern) {
      if (source === pattern) {
        return true;
      } else if (pattern[pattern.length - 1] !== "*") {
        return false;
      } else if (pattern.length === 1) {
        return true;
      } else {
        return source.slice(0, (pattern.length - 1)) === pattern.slice(0, (pattern.length - 1));
      }
    };

    return PropDict;

  })();

  Bindata = (function() {

    function Bindata(data) {
      this.data = data != null ? data : "";
      this.offset = 0;
    }

    Bindata.prototype.seek = function(offset) {
      this.offset = offset;
    };

    Bindata.prototype.tell = function() {
      return this.offset;
    };

    Bindata.prototype.read_int = function() {
      var data;
      data = this.read_data(4);
      return this.unpack_int(data);
    };

    Bindata.prototype.read_string = function() {
      var length, str, val;
      length = this.read_int();
      val = this.read_data(length);
      str = val.slice(0, (val.length - 1));
      return Util.decode_utf8(str);
    };

    Bindata.prototype.read_data = function(length) {
      var data;
      if (length == null) length = this.data.length - this.offset;
      data = this.data.slice(this.offset, this.offset + length);
      this.offset += length;
      return data;
    };

    Bindata.prototype.unpack_int = function(data) {
      var num;
      num = 0;
      num += (data.charCodeAt(0) & 0xFF) << 24;
      num += (data.charCodeAt(1) & 0xFF) << 16;
      num += (data.charCodeAt(2) & 0xFF) << 8;
      num += data.charCodeAt(3) & 0xFF;
      return num;
    };

    Bindata.prototype.write_int = function(num) {
      return this.write_data(this.pack_int(num));
    };

    Bindata.prototype.write_string = function(val) {
      var str;
      str = Util.encode_utf8(val);
      this.write_int(str.length + 1);
      this.write_data(str);
      return this.write_data("\x00");
    };

    Bindata.prototype.write_data = function(data) {
      this.data = this.data.slice(0, this.offset) + data + this.data.slice(this.offset, this.data.length);
      return this.offset += data.length;
    };

    Bindata.prototype.pack_int = function(num) {
      var data;
      data = "";
      data += String.fromCharCode(num >> 24 & 0xFF);
      data += String.fromCharCode(num >> 16 & 0xFF);
      data += String.fromCharCode(num >> 8 & 0xFF);
      data += String.fromCharCode(num & 0xFF);
      return data;
    };

    return Bindata;

  })();

  Error = (function() {

    function Error(msg) {
      this.msg = msg;
    }

    return Error;

  })();

  Client = (function() {

    Client.IPC = {};

    Client.prototype.protocol_version = 19;

    Client.prototype.max_cookie = 524288;

    function Client(clientname) {
      this.clientname = clientname;
      this.main = new Client.IPC.Main(this);
      this.xform = new Client.IPC.Xform(this);
      this.config = new Client.IPC.Config(this);
      this.bindata = new Client.IPC.Bindata(this);
      this.medialib = new Client.IPC.Medialib(this);
      this.playback = new Client.IPC.Playback(this);
      this.playlist = new Client.IPC.Playlist(this);
      this.collection = new Client.IPC.Collection(this);
      this.visualization = new Client.IPC.Visualization(this);
      this.mediainfo_reader = new Client.IPC.MediainfoReader(this);
    }

    Client.prototype.connect = function(ipcpath) {
      this.ipcpath = ipcpath != null ? ipcpath : this.default_ipcpath();
      this.cookie = 0;
      this.results = [];
      this.current_data = null;
      this.current_msg = null;
      if (this.ipcpath.slice(0, 4) === "unix" || this.ipcpath.slice(0, 3) === "tcp") {
        this.socktype = "node";
        return this.connect_node(this.ipcpath);
      } else if (this.ipcpath.slice(0, 2) === "ws") {
        this.socktype = "websocket";
        return this.connect_websocket(this.ipcpath);
      } else {
        throw new URIError("Invalid protocol, must be ws, unix or tcp");
      }
    };

    Client.prototype.default_ipcpath = function() {
      if (typeof process === "object") {
        if (process.env.XMMS_PATH) {
          return process.env.XMMS_PATH;
        } else {
          return "unix:///tmp/xmms-ipc-" + process.env.USER;
        }
      } else {
        return "ws://localhost:9668";
      }
    };

    Client.prototype.connect_node = function(path) {
      var parsed,
        _this = this;
      this.sock = new net.Socket();
      this.sock.on("connect", function() {
        var result;
        result = _this.main.hello(_this.protocol_version, _this.clientname);
        return result.onvalue = _this.onconnect;
      });
      this.sock.on("data", function(data) {
        _this.current_data = new Bindata(data.toString("binary"));
        return _this.process_data();
      });
      this.sock.on("close", function(unclean) {
        return typeof _this.ondisconnect === "function" ? _this.ondisconnect(!unclean) : void 0;
      });
      parsed = url.parse(path);
      if (parsed.protocol === "unix:") {
        this.sock.connect(parsed.path);
      } else {
        this.sock.connect(parsed.port, parsed.hostname);
      }
      return this;
    };

    Client.prototype.connect_websocket = function(path, wsprotocol) {
      var _this = this;
      this.wsprotocol = wsprotocol != null ? wsprotocol : "base64";
      this.sock = new WebSocket(path, this.wsprotocol);
      this.sock.onopen = function(event) {
        var result;
        result = _this.main.hello(_this.protocol_version, _this.clientname);
        return result.onvalue = _this.onconnect;
      };
      this.sock.onmessage = function(event) {
        var binary;
        if (_this.wsprotocol === "binary") {} else {
          binary = atob(event.data);
          _this.current_data = new Bindata(binary);
          return _this.process_data();
        }
      };
      this.sock.onclose = function(event) {
        return typeof _this.ondisconnect === "function" ? _this.ondisconnect(event.wasClean, event.reason) : void 0;
      };
      return this;
    };

    Client.prototype.disconnect = function() {
      if (!this.connected()) return;
      if (this.socktype === "websocket") {
        return this.sock.close();
      } else if (this.socktype === "node") {
        return this.sock.end();
      }
    };

    Client.prototype.connected = function() {
      if (this.socktype === "websocket") {
        if (this.sock && this.sock.readyState === WebSocket.OPEN) {
          return true;
        } else {
          return false;
        }
      } else if (this.socktype === "node") {
        return this.sock.readable;
      }
    };

    Client.prototype.process_data = function() {
      var data_left, msg, need_to_read;
      if (this.current_msg === null) {
        msg = new Message();
        msg.object_id = this.current_data.read_int();
        msg.command_id = this.current_data.read_int();
        msg.cookie = this.current_data.read_int();
        msg.payload_length = this.current_data.read_int();
        data_left = this.current_data.data.length - this.current_data.tell();
        if (msg.payload_length > data_left) {
          msg.payload.data += this.current_data.read_data(data_left);
          this.current_msg = msg;
          return;
        } else {
          msg.payload.data += this.current_data.read_data(msg.payload_length);
          this.process_msg(msg);
        }
        if (this.current_data.tell() < this.current_data.data.length) {
          return this.process_data();
        }
      } else {
        data_left = this.current_data.data.length - this.current_data.tell();
        need_to_read = this.current_msg.payload_length - this.current_msg.payload.data.length;
        if (need_to_read > data_left) {
          this.current_msg.payload.data += this.current_data.read_data(data_left);
          return;
        } else {
          this.current_msg.payload.data += this.current_data.read_data(need_to_read);
          this.process_msg(this.current_msg);
          this.current_msg = null;
        }
        if (this.current_data.tell() < this.current_data.data.length) {
          return this.process_data();
        }
      }
    };

    Client.prototype.process_msg = function(msg) {
      var idx, restart, restart_msg, result, reusable, _i, _len, _ref, _results;
      _ref = this.results;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.cookie === msg.cookie) {
          msg.payload.seek(0);
          reusable = false;
          result.value = Value.deserialize(msg.payload);
          result.is_signal = msg.command_id === 32;
          result.is_broadcast = msg.command_id === 33;
          if (result.onvalue) {
            restart = typeof result.onvalue === "function" ? result.onvalue(result.value) : void 0;
            if (restart && result.is_signal) {
              restart_msg = new Message();
              restart_msg.object_id = msg.object_id;
              restart_msg.command_id = msg.command_id;
              restart_msg.args = [result.signal_id];
              this.send_signal_restart_message(restart_msg, result);
              reusable = true;
            }
          }
          if (!reusable && !result.is_broadcast) {
            idx = this.results.indexOf(result);
            if (idx !== -1) {
              this.results.splice(idx, 1);
              break;
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Client.prototype.send = function(data) {
      if (this.socktype === "websocket") {
        if (this.wsprotocol === "binary") {} else {
          return this.sock.send(btoa(data));
        }
      } else if (this.socktype === "node") {
        return this.sock.write(data);
      }
    };

    Client.prototype.send_message = function(msg) {
      var cookie, msgdata, result;
      cookie = this.next_cookie();
      msgdata = msg.assemble(cookie);
      result = new Result(cookie);
      this.results.push(result);
      this.send(msgdata);
      return result;
    };

    Client.prototype.send_signal_message = function(msg, signal_id) {
      var result;
      result = this.send_message(msg);
      result.signal_id = signal_id;
      return result;
    };

    Client.prototype.send_signal_restart_message = function(msg, result) {
      var cookie, msgdata;
      cookie = this.next_cookie();
      msgdata = msg.assemble(cookie);
      result.cookie = cookie;
      this.send(msgdata);
      return result;
    };

    Client.prototype.next_cookie = function() {
      if (this.cookie === this.max_cookie) {
        this.cookie = 0;
      } else {
        this.cookie += 1;
      }
      return this.cookie;
    };

    return Client;

  })();

  ActivePlaylist = "_active";

  CollectionChanged = {
    ADD: 0,
    UPDATE: 1,
    RENAME: 2,
    REMOVE: 3
  };

  CollectionNamespace = {
    ALL: "*",
    COLLECTIONS: "Collections",
    PLAYLISTS: "Playlists"
  };

  MedialibEntryStatus = {
    NEW: 0,
    OK: 1,
    RESOLVING: 2,
    NOT_AVAILABLE: 3,
    REHASH: 4
  };

  MediainfoReaderStatus = {
    IDLE: 0,
    RUNNING: 1
  };

  PlaybackStatus = {
    STOP: 0,
    PLAY: 1,
    PAUSE: 2
  };

  PlaylistChange = {
    ADD: 0,
    INSERT: 1,
    SHUFFLE: 2,
    REMOVE: 3,
    CLEAR: 4,
    MOVE: 5,
    SORT: 6,
    UPDATE: 7
  };

  Seek = {
    CUR: 1,
    SET: 2
  };

  PluginType = {
    ALL: 0,
    OUTPUT: 1,
    XFORM: 2
  };

  xmmsclient = this.xmmsclient = {};

  xmmsclient.ActivePlaylist = ActivePlaylist;

  xmmsclient.Bindata = Bindata;

  xmmsclient.Client = Client;

  xmmsclient.Collection = Collection;

  xmmsclient.CollectionChanged = CollectionChanged;

  xmmsclient.CollectionNamespace = CollectionNamespace;

  xmmsclient.Error = Error;

  xmmsclient.MedialibEntryStatus = MedialibEntryStatus;

  xmmsclient.MediainfoReaderStatus = MediainfoReaderStatus;

  xmmsclient.Message = Message;

  xmmsclient.PlaybackStatus = PlaybackStatus;

  xmmsclient.PlaylistChange = PlaylistChange;

  xmmsclient.PluginType = PluginType;

  xmmsclient.PropDict = PropDict;

  xmmsclient.Result = Result;

  xmmsclient.Seek = Seek;

  xmmsclient.Value = Value;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = xmmsclient;
  }

}).call(this);
