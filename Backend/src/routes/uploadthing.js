const { createRouteHandler } = require("uploadthing/express")
const { ourFileRouter } = require("../utils/uploadthing")

module.exports = createRouteHandler({ router: ourFileRouter })