describe "Client", ->
	client = null

	beforeEach ->
		client = new xmmsclient.Client("test")

	it "connect", ->
		client.connect("ws://localhost:12345")
