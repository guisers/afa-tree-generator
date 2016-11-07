var express = require('express')
var router = express.Router()
const getPixels = require('get-pixels')

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
    if (err) {
      console.log("ERROR: Couldn't convert csvstring to json...")
      console.log(err)
    }
    res.locals.donors = result
    return next()
  })
}

const getRandom = function(max, min=0) {
  return Math.floor((Math.random() * max) + min);
}

const getValidPosition = function(pixels, width, height) {
  var x
  var y
  var alpha
  do {
    x = getRandom(width)
    y = getRandom(height)
    alpha = pixels.get(x, y, 3) // 3 is alpha channel
  } while (alpha === 0)
  return {x, y}
}

const positionCalculator = function(req, res, next) {
  const height = 1129
  const width = 600
  var donors = res.locals.donors

  getPixels('public/images/tree.png', function(err, pixels) {
    donors.forEach(function(donor) {
      const pos = getValidPosition(pixels, width, height)
      donor.x = pos.x
      donor.y = pos.y
    })
    res.locals.donors = donors
    return next()
  })
}

/* GET landing page. */
router.get('/', indexRender)

/* POST generate a tree. */
router.post('/generate', upload.single('donorData'), fileParser, positionCalculator, resultRender)

/* GET generate page. */
router.get('/generate', function(req, res, next) {
  res.redirect('/')
})

module.exports = router
