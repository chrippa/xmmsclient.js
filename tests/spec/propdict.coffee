describe "PropDict", ->
	dict = null
	beforeEach ->
		dict =
			artist:
				"plugin/id3v2": "A long artist name"
				"plugin/mad": "A long artist"
			album:
				"plugin/id3v2": "A long album name"

	it "default preference", ->
		flattened = xmmsclient.PropDict.flatten(dict)

		expect(flattened.artist).toEqual("A long artist name")

	it "preference", ->
		pref = ["plugin/mad", "*"]
		flattened = xmmsclient.PropDict.flatten(dict, pref)

		expect(flattened.artist).toEqual("A long artist")

	it "preference but missing", ->
		pref = ["plugin/mad", "*"]
		flattened = xmmsclient.PropDict.flatten(dict, pref)

		expect(flattened.album).toEqual("A long album name")

	it "match pattern", ->
		propdict = new xmmsclient.PropDict(dict)

		expect(propdict.source_match_pattern("server", "server")).toBeTruthy()
		expect(propdict.source_match_pattern("client/test", "client/*")).toBeTruthy()
		expect(propdict.source_match_pattern("anything", "*")).toBeTruthy()
