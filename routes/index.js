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

const getColoredPixel = function(pixels, width, height, itemWidth, itemHeight) {
  var x
  var y
  var start_alpha
  var start_red
  var end_alpha
  var end_red
  do {
    x = getRandom(width)
    y = getRandom(height)
    // 3 is alpha channel, 0 is red channel
    start_alpha = pixels.get(x, y, 3)
    start_red = pixels.get(x, y, 0)
    end_alpha = pixels.get(x+itemWidth, y+itemHeight, 3)
    end_red = pixels.get(x+itemWidth, y+itemHeight, 0)
  } while (start_alpha === 0 || end_alpha === 0 || start_red === 203 || end_red === 203)

  return {x, y}
}

const isOverlappingPixels = function(existing, proposed, itemWidth, itemHeight) {
  return (existing.x < proposed.x && proposed.x < existing.x + itemWidth
    || proposed.x < existing.x && existing.x < proposed.x + itemWidth)
    && (existing.y < proposed.y && proposed.y < existing.y + itemHeight
    || proposed.y < existing.y && existing.y < proposed.y + itemWidth)
}

const isOverlappingExistingItems = function(pos, positions, itemWidth, itemHeight) {
  var isOverlapping = false
  positions.forEach(function(position) {
    if (isOverlappingPixels(position, pos, itemWidth, itemHeight)) {
      isOverlapping = true
    }
  })
  return isOverlapping
}

const getValidPosition = function(pixels, positions) {
  const height = 1129
  const width = 600
  const itemWidth = 30
  const itemHeight = 56

  var result

  do {
    result = getColoredPixel(pixels, width, height, itemWidth, itemHeight)
  } while (isOverlappingExistingItems(result, positions, itemWidth, itemHeight))

  return result
}

const positionCalculator = function(req, res, next) {

  var donors = res.locals.donors

  getPixels('public/images/tree.png', function(err, pixels) {
    var positions = []
    donors.forEach(function(donor) {
      const pos = getValidPosition(pixels, positions)
      positions.push(pos)
      donor.x = pos.x
      donor.y = pos.y
      donor.color = getRandom(6)
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
