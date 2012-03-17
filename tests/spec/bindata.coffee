describe "Bindata", ->
	data = new xmmsclient.Bindata()
	test_int = 1024
	test_string = "Test string"
	test_data = "\x00\x01\x02\x04"

	it "write int", ->
		data.write_int(test_int)

	it "write string", ->
		data.write_string(test_string)

	it "write data", ->
		data.write_data(test_data)
		data.write_data(test_data)

	it "seek", ->
		data.seek(0)
		expect(data.tell()).toEqual(0)

	it "read int", ->
		expect(data.read_int()).toEqual(test_int)

	it "read string", ->
		expect(data.read_string()).toEqual(test_string)

	it "read data", ->
		expect(data.read_data(4)).toEqual(test_data)

	it "read rest of data", ->
		expect(data.read_data()).toEqual(test_data)
