describe "Bindata", ->
	data = null
	test_int = 1024
	test_string = "Test string"
	test_data = "\x00\x01\x02\x04"

	test_int_data = "\x00\x00\x04\x00"
	test_string_data = "\x00\x00\x00\fTest string\x00"

	beforeEach ->
		data = new xmmsclient.Bindata()

	it "write int", ->
		data.write_int(test_int)

		expect(data.data).toEqual(test_int_data)

	it "write string", ->
		data.write_string(test_string)

		expect(data.data).toEqual(test_string_data)

	it "write data", ->
		data.write_data(test_data)

		expect(data.data).toEqual(test_data)

	it "seek", ->
		data.seek(0)
		expect(data.tell()).toEqual(0)

	it "read int", ->
		data.data = test_int_data

		expect(data.read_int()).toEqual(test_int)

	it "read string", ->
		data.data = test_string_data

		expect(data.read_string()).toEqual(test_string)

	it "read data", ->
		data.data = test_data

		expect(data.read_data(4)).toEqual(test_data)

	it "read rest of data", ->
		data.data = test_data + test_data
		data.offset = 4

		expect(data.read_data()).toEqual(test_data)
