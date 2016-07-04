if typeof process == "object"
	net = require "net"
	url = require "url"
else
	@WebSocket = MozWebSocket? and MozWebSocket or WebSocket? and WebSocket

class Util
	@debug_on = false
	@debug: ->
		console.log(arguments) if @debug_on

	@encode_utf8: (str) ->
		return unescape(encodeURIComponent(str))

	@decode_utf8: (str) ->
		return decodeURIComponent(escape(str))

	@dump_buffer: (data) ->
		list = []
		for i in [0...data.length]
			list[i] = data.charCodeAt(i)
		return list


class Message
	@check_int: (val) ->
		throw new TypeError "Invalid argument, expected number" unless typeof(val) is "number"
		throw new TypeError "Invalid argument, number is out of range" if val > 0x7fffffff or val < -0x80000000
		return val

	@check_binary: (val) ->
		throw new TypeError "Invalid argument, expected bindata" unless val instanceof Bindata
		return val

	@check_string: (val) ->
		throw new TypeError "Invalid argument, expected string" unless val and val.toString
		return val.toString()

	@check_list: (val, subtype) ->
		throw new TypeError "Invalid argument, expected list" unless Array.isArray(val)
		for value in val
			throw new TypeError "Invalid value in list, expected #{subtype}" unless typeof(value) == subtype
		return val

	@check_dictionary: (val, subtype) ->
		throw new TypeError "Invalid argument, expected dictionary" unless typeof(val) is "object"
		for key, value of val
			if subtype
				throw new TypeError "Invalid value in dict, expected #{subtype}" unless typeof(value) is subtype
		return val

	@check_collection: (val) ->
		throw new TypeError "Invalid argument, expected collection" unless val instanceof Collection
		return val

	constructor: ->
		@object_id = null
		@command_id = null
		@cookie = null
		@payload = new Bindata()
		@payload_length = 0
		@args = []

	assemble: (cookie) ->
		payload = new Bindata()
		Value.serialize(payload, @args)

		header = new Bindata()
		header.write_int32(@object_id)
		header.write_int32(@command_id)
		header.write_int32(cookie)
		header.write_int32(payload.data.length)

		return header.data + payload.data


class Value
	@Type:
		None:       0x00
		Error:      0x01
		Integer:    0x02
		String:     0x03
		Collection: 0x04
		Binary:     0x05
		List:       0x06
		Dictionary: 0x07

	@serialize_bin: (bindata, val) ->
		bindata.write_int32 val.data.length
		bindata.write_data val.data

	@serialize_coll: (bindata, val) ->
		bindata.write_int32 val.type

		@serialize_dict(bindata, val.attributes)
		@serialize_list(bindata, val.idlist, @Type.Integer)

		if val.type == val.Type.Reference
			@serialize_list(bindata, [], @Type.Collection)
		else
			@serialize_list(bindata, val.operands, @Type.Collection)

	@serialize_list: (bindata, val, type) ->
		type ?= @Type.None
		bindata.write_int32 type
		bindata.write_int32 val.length

		for value, i in val
			if type == @Type.None
				@serialize(bindata, value)
			else
				@serialize_value(bindata, value)

	@serialize_dict: (bindata, val) ->
		length = 0
		for key of val
			length += 1

		bindata.write_int32 length
		for key, value of val
			bindata.write_string key
			@serialize(bindata, value)

	@serialize: (bindata, val) ->
		@serialize_type(bindata, val)
		@serialize_value(bindata, val)

	@serialize_type: (bindata, val) ->
		switch typeof(val)
			when "string"
				bindata.write_int32 @Type.String

			when "number"
				bindata.write_int32 @Type.Integer

			when "object"
				if Array.isArray(val)
					bindata.write_int32 @Type.List

				else if val instanceof Bindata
					bindata.write_int32 @Type.Binary

				else if val instanceof Collection
					bindata.write_int32 @Type.Collection

				else
					bindata.write_int32 @Type.Dictionary

	@serialize_value: (bindata, val) ->
		switch typeof(val)
			when "string"
				bindata.write_string val

			when "number"
				bindata.write_int64 val

			when "object"
				if Array.isArray(val)
					@serialize_list(bindata, val)

				else if val instanceof Bindata
					@serialize_bin(bindata, val)

				else if val instanceof Collection
					@serialize_coll(bindata, val)

				else
					@serialize_dict(bindata, val)

	@deserialize_bin: (bindata) ->
		length = bindata.read_int32()
		return new Bindata(bindata.read_data(length))

	@deserialize_coll: (bindata) ->
		type = bindata.read_int32()
		coll = new Collection(type)

		coll.attributes = @deserialize_dict(bindata)
		coll.idlist = @deserialize_list(bindata)
		coll.operands = @deserialize_list(bindata)

		return coll

	@deserialize_list: (bindata) ->
		type = bindata.read_int32()
		length = bindata.read_int32()
		list = []
		for i in [0...length]
			if type == @Type.None
				list[i] = @deserialize(bindata)
			else
				list[i] = @deserialize(bindata, type)

		return list

	@deserialize_dict: (bindata) ->
		dict = {}
		length = bindata.read_int32()

		for i in [0...length]
			key = bindata.read_string()
			value = @deserialize(bindata)
			dict[key] = value

		return dict

	@deserialize_value: (bindata, type) ->
		switch type
			when Value.Type.None
				return null

			when Value.Type.Error
				return new Error(bindata.read_string())

			when Value.Type.Integer
				return bindata.read_int64()

			when Value.Type.String
				return bindata.read_string()

			when Value.Type.Binary
				return @deserialize_bin(bindata)

			when Value.Type.Collection
				return @deserialize_coll(bindata)

			when Value.Type.List
				return @deserialize_list(bindata)

			when Value.Type.Dictionary
				return @deserialize_dict(bindata)

	@deserialize: (bindata) ->
		type = bindata.read_int32()
		return @deserialize_value(bindata, type)


class Result
	constructor: (@cookie) ->
		@is_signal = false
		@is_broadcast = false
		@onvalue = null
		@value = null

class Collection
	Type:
		Reference:    0
		Universe:     1
		Union:        2
		Intersection: 3
		Complement:   4
		Has:          5
		Match:        6
		Token:        7
		Equals:       8
		NotEqual:     9
		Smaller:      10
		SmallerEq:    11
		Greater:      12
		GreaterEq:    13
		Order:        14
		Limit:        15
		MediaSet:     16
		IDList:       17

	constructor: (@type) ->
		@reset()

	reset: ->
		@attributes = {}
		@operands = []
		@idlist = []

	class @Universe extends Collection
		constructor: ->
			super @Type.Universe

	class List extends Collection
		constructor: (type = "list", list = [], operands = []) ->
			super @Type.IDList
			@attributes.type = type
			for item in list
				@idlist.push(item)
			for operand in operands
				@operands.push(operand)

	class @IDList extends List
		constructor: (list, operands) ->
			super("list", list, operands)

	class @Queue extends List
		constructor: (list, operands) ->
			super("queue", list, operands)

	class @PartyShuffle extends List
		contructor: (list, operands = [new Collection.Universe()]) ->
			super("pshuffle", list, operands)

	class @Reference extends Collection
		constructor: (ref, ns = "Collections") ->
			super @Type.Reference

			@attributes["reference"] = ref
			@attributes["namespace"] = ns

	class @Complement extends Collection
		constructor: (operand) ->
			super @Type.Complement
			@operands.push(operand) if operand

	class @Intersection extends Collection
		constructor: (operands = []) ->
			super @Type.Intersection
			for operand in operands
				@operands.push(operand)

	class @Union extends Collection
		constructor: (operands = []) ->
			super @Type.Union
			for operand in operands
				@operands.push(operand)

	class Operand extends Collection
		constructor: (type, parent = new Collection.Universe(), attr) ->
			super(type)

			for key, value of attr
				@attributes[key] = value
			@operands.push(parent)

	class @Has extends Operand
		constructor: (parent, attr) ->
			super(@Type.Has, parent, attr)

	class @Match extends Operand
		constructor: (parent, attr) ->
			super(@Type.Match, parent, attr)

	class @Token extends Operand
		constructor: (parent, attr) ->
			super(@Type.Token, parent, attr)

	class @Equals extends Operand
		constructor: (parent, attr) ->
			super(@Type.Equals, parent, attr)

	class @NotEqual extends Operand
		constructor: (parent, attr) ->
			super(@Type.NotEqual, parent, attr)

	class @Smaller extends Operand
		constructor: (parent, attr) ->
			super(@Type.Smaller, parent, attr)

	class @SmallerEqual extends Operand
		constructor: (parent, attr) ->
			super(@Type.SmallerEq, parent, attr)

	class @Greater extends Operand
		constructor: (parent, attr) ->
			super(@Type.Greater, parent, attr)

	class @GreaterEqual extends Operand
		constructor: (parent, attr) ->
			super(@Type.GreaterEq, parent, attr)

	class @Order extends Operand
		constructor: (parent, attr) ->
			super(@Type.Order, parent, attr)

	class @Limit extends Operand
		constructor: (parent, start, length) ->
			super(@Type.Limit, parent,
			      start: start, length: length)

	class @Mediaset extends Operand
		constructor: (parent, attr) ->
			super(@Type.Mediaset, parent, attr)


class PropDict
	@default_source_prefs = ["server", "client/*", "plugin/id3v2",
	                         "plugin/segment", "plugin/*", "*"]

	@flatten: (dict, source_prefs) ->
		propdict = new PropDict(source_prefs)
		return propdict.transform(dict)

	constructor: (@source_prefs = PropDict.default_source_prefs) ->

	transform: (dict) ->
		newdict = {}

		for key, inner_dict of dict
			lowest = @source_prefs.length + 1
			for inner_key of inner_dict
				index = @find_matching_pattern(inner_key)
				if index < lowest
					newdict[key] = inner_dict[inner_key]
					lowest = index

		return newdict

	find_matching_pattern: (key) ->
		for pattern, i in @source_prefs
			return i if @source_match_pattern(key, pattern)

	source_match_pattern: (source, pattern) ->
		if source == pattern
			return true
		else if pattern[pattern.length-1] != "*"
			return false
		else if pattern.length == 1
			return true
		else
			return source[0...pattern.length-1] == pattern[0...pattern.length-1]


class Bindata
	constructor: (@data = "") ->
		@offset = 0

	seek: (@offset) ->

	tell: ->
		return @offset

	read_int32: ->
		data = @read_data(4)
		return @unpack_int32(data)

	read_int64: ->
		data = @read_data(8)
		return @unpack_int64(data)

	read_string: ->
		length = @read_int32()
		val = @read_data(length)
		str = val[0...val.length-1]
		return Util.decode_utf8(str)

	read_data: (length = @data.length - @offset) ->
		data = @data.slice(@offset, @offset + length)
		@offset += length
		return data

	unpack_int32: (data) ->
		num = 0
		num += (data.charCodeAt(0) & 0xFF) << 24
		num += (data.charCodeAt(1) & 0xFF) << 16
		num += (data.charCodeAt(2) & 0xFF) << 8
		num += (data.charCodeAt(3) & 0xFF)
		return num

	unpack_int64: (data) ->
		num = 0
		num += (data.charCodeAt(0) & 0xFF) << 56
		num += (data.charCodeAt(1) & 0xFF) << 48
		num += (data.charCodeAt(2) & 0xFF) << 40
		num += (data.charCodeAt(3) & 0xFF) << 32
		num += (data.charCodeAt(4) & 0xFF) << 24
		num += (data.charCodeAt(5) & 0xFF) << 16
		num += (data.charCodeAt(6) & 0xFF) << 8
		num += (data.charCodeAt(7) & 0xFF)
		return num

	write_int32: (num) ->
		@write_data(@pack_int32(num))

	write_int64: (num) ->
		@write_data(@pack_int64(num))

	write_string: (val) ->
		str = Util.encode_utf8(val)

		@write_int32 str.length + 1
		@write_data str
		@write_data "\x00"

	write_data: (data) ->
		@data = @data.slice(0, @offset) + data + @data.slice(@offset, @data.length)
		@offset += data.length

	pack_int32: (num) ->
		data = ""
		data += String.fromCharCode(num >> 24 & 0xFF)
		data += String.fromCharCode(num >> 16 & 0xFF)
		data += String.fromCharCode(num >> 8 & 0xFF)
		data += String.fromCharCode(num & 0xFF)
		return data

	pack_int64: (num) ->
		data = ""
		data += String.fromCharCode(0)
		data += String.fromCharCode(0)
		data += String.fromCharCode(0)
		data += String.fromCharCode(0)
		data += String.fromCharCode(num >> 24 & 0xFF)
		data += String.fromCharCode(num >> 16 & 0xFF)
		data += String.fromCharCode(num >> 8 & 0xFF)
		data += String.fromCharCode(num & 0xFF)
		return data


class Error
	constructor: (@msg) ->

class Client
	@IPC = {}

	protocol_version: 23
	max_cookie: 524288

	constructor: (@clientname) ->
		@main             = new Client.IPC.Main @
		@xform            = new Client.IPC.Xform @
		@config           = new Client.IPC.Config @
		@bindata          = new Client.IPC.Bindata @
		@medialib         = new Client.IPC.Medialib @
		@playback         = new Client.IPC.Playback @
		@playlist         = new Client.IPC.Playlist @
		@collection       = new Client.IPC.Collection @
		@visualization    = new Client.IPC.Visualization @
		@mediainfo_reader = new Client.IPC.MediainfoReader @

	connect: (@ipcpath = @default_ipcpath()) ->
		@cookie = -1
		@results = []
		@current_data = null
		@current_msg = null

		if @ipcpath[..3] == "unix" or @ipcpath[..2] == "tcp"
			@socktype = "node"
			@connect_node(@ipcpath)
		else if @ipcpath[..1] == "ws"
			@socktype = "websocket"
			@connect_websocket(@ipcpath)
		else
			throw new URIError "Invalid protocol, must be ws, unix or tcp"

	default_ipcpath: ->
		if typeof process == "object"
			if process.env.XMMS_PATH
				return process.env.XMMS_PATH
			else
				return "unix:///tmp/xmms-ipc-#{process.env.USER}"
		else
			return "ws://localhost:9668"

	connect_node: (path) ->
		@sock = new net.Socket()

		@sock.on "connect", =>
			result = @main.hello(@protocol_version, @clientname)
			result.onvalue = @onconnect

		@sock.on "data", (data) =>
			@current_data = new Bindata(data.toString("binary"))
			@process_data()

		@sock.on "close", (unclean) =>
			@ondisconnect?(not unclean)

		@sock.on "error", (error) =>
			@onerror(error)

		parsed = url.parse(path)

		if parsed.protocol == "unix:"
			@sock.connect(parsed.path)
		else
			@sock.connect(parsed.port, parsed.hostname)

		return @

	connect_websocket: (path, @wsprotocol = "base64") ->
		@sock = new WebSocket(path, @wsprotocol)

		@sock.onopen = (event) =>
			result = @main.hello(@protocol_version, @clientname)
			result.onvalue = @onconnect

		@sock.onmessage = (event) =>
			if @wsprotocol == "binary"
				# todo
			else
				binary = atob(event.data)
				@current_data = new Bindata(binary)
				@process_data()

		@sock.onclose = (event) =>
			@ondisconnect?(event.wasClean, event.reason)

		return @

	disconnect: ->
		return if not @connected()

		if @socktype == "websocket"
			@sock.close()
		else if @socktype == "node"
			@sock.end()

	connected: ->
		if @socktype == "websocket"
			if @sock and @sock.readyState == WebSocket.OPEN
				return true
			else
				return false
		else if @socktype == "node"
			return @sock.readable

	process_data: ->
		if @current_msg == null
			msg = new Message()
			msg.object_id = @current_data.read_int32()
			msg.command_id = @current_data.read_int32()
			msg.cookie = @current_data.read_int32()
			msg.payload_length = @current_data.read_int32()

			data_left = @current_data.data.length - @current_data.tell()
			if msg.payload_length > data_left
				msg.payload.data += @current_data.read_data(data_left)
				@current_msg = msg
				return
			else
				msg.payload.data += @current_data.read_data(msg.payload_length)
				@process_msg(msg)

			@process_data() if @current_data.tell() < @current_data.data.length
		else
			data_left = @current_data.data.length - @current_data.tell()
			need_to_read = @current_msg.payload_length - @current_msg.payload.data.length

			if need_to_read > data_left
				@current_msg.payload.data += @current_data.read_data(data_left)
				return
			else
				@current_msg.payload.data += @current_data.read_data(need_to_read)
				@process_msg(@current_msg)
				@current_msg = null

			@process_data() if @current_data.tell() < @current_data.data.length


	process_msg: (msg) ->
		for result in @results
			if result.cookie == msg.cookie
				msg.payload.seek(0)

				reusable = false
				result.value = Value.deserialize(msg.payload)
				result.is_signal = msg.command_id == 32
				result.is_broadcast = msg.command_id == 33

				if result.onvalue
					restart = result.onvalue?(result.value)

					if restart and result.is_signal
						restart_msg = new Message()
						restart_msg.object_id = msg.object_id
						restart_msg.command_id = msg.command_id
						restart_msg.args = [result.signal_id]

						@send_signal_restart_message(restart_msg, result)
						reusable = true

				if not reusable and not result.is_broadcast
					idx = @results.indexOf(result)
					if idx != -1
						@results.splice(idx, 1)
						break

	send: (data) ->
		if @socktype == "websocket"
			if @wsprotocol == "binary"
				# todo
			else
				@sock.send(btoa(data))
		else if @socktype == "node"
			@sock.write(data, "binary")

	send_message: (msg) ->
		cookie = @next_cookie()
		msgdata = msg.assemble(cookie)
		result = new Result(cookie)

		@results.push(result)
		@send msgdata

		return result

	send_signal_message: (msg, signal_id) ->
		result = @send_message(msg)
		result.signal_id = signal_id

		return result

	send_signal_restart_message: (msg, result) ->
		cookie = @next_cookie()
		msgdata = msg.assemble(cookie)
		result.cookie = cookie

		@send msgdata

		return result

	next_cookie: ->
		if @cookie == @max_cookie
			@cookie = 0
		else
			@cookie += 1

		return @cookie


ActivePlaylist = "_active"

CollectionChanged =
	ADD:    0
	UPDATE: 1
	RENAME: 2
	REMOVE: 3

CollectionNamespace =
	ALL:         "*"
	COLLECTIONS: "Collections"
	PLAYLISTS:   "Playlists"


MedialibEntryStatus =
	NEW:           0
	OK:            1
	RESOLVING:     2
	NOT_AVAILABLE: 3
	REHASH:        4

MediainfoReaderStatus =
	IDLE:    0
	RUNNING: 1

PlaybackStatus =
	STOP:  0
	PLAY:  1
	PAUSE: 2

PlaylistChange =
	ADD:     0
	INSERT:  1
	SHUFFLE: 2
	REMOVE:  3
	CLEAR:   4
	MOVE:    5
	SORT:    6
	UPDATE:  7

Seek =
	CUR: 1
	SET: 2

PluginType =
	ALL:    0
	OUTPUT: 1
	XFORM:  2

xmmsclient = {}
xmmsclient.ActivePlaylist = ActivePlaylist
xmmsclient.Bindata = Bindata
xmmsclient.Client = Client
xmmsclient.Collection = Collection
xmmsclient.CollectionChanged = CollectionChanged
xmmsclient.CollectionNamespace = CollectionNamespace
xmmsclient.Error = Error
xmmsclient.MedialibEntryStatus = MedialibEntryStatus
xmmsclient.MediainfoReaderStatus = MediainfoReaderStatus
xmmsclient.Message = Message
xmmsclient.PlaybackStatus = PlaybackStatus
xmmsclient.PlaylistChange = PlaylistChange
xmmsclient.PluginType = PluginType
xmmsclient.PropDict = PropDict
xmmsclient.Result = Result
xmmsclient.Seek = Seek
xmmsclient.Value = Value

if module?.exports?
	module.exports = xmmsclient
else
	window.xmmsclient = xmmsclient
