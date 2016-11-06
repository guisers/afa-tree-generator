const testData = require('../test/data') // FOR TESTING

var express = require('express')
var router = express.Router()

// File upload utils
var multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

// csv to json utils
var Converter = require('csvtojson').Converter;

const indexRender = function(req, res, next) {
  res.render('index', {
    title: 'Home - Christmas Tree Generator'
  })
}

const resultRender = function(req, res, next) {
  console.log('Generating tree with the following data:')
  console.log(res.locals.donors)
  res.render('result', {
    title: 'Result - Christmas Tree Generator'
  })
}

const fileParser = function(req, res, next) {
  const file = req.file
  const csvString = file.buffer.toString()
  const converter = new Converter({});
  converter.fromString(csvString, function(err, result) {
    res.locals.donors = result
    return next()
  })
}

/* GET landing page. */
router.get('/', indexRender)

/* POST generate a tree. */
router.post('/generate', upload.single('donorData'), fileParser, resultRender)

/* GET generate page. */
router.get('/generate', function(req, res, next) {
  res.redirect('/')
})

module.exports = router
