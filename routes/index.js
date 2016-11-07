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
  var tl_alpha
  var tl_red
  var tr_alpha
  var tr_end
  var out_of_bounds

  do {
    x = getRandom(width)
    y = getRandom(height)
    if (x + itemWidth > width || y + itemHeight > height) {
      out_of_bounds = true
    } else {
      out_of_bounds = false
    }
    // 3 is alpha channel, 0 is red channel
    tl_alpha = pixels.get(x, y, 3)
    tl_red = pixels.get(x, y, 0)
    tr_alpha = pixels.get(x + itemWidth, y, 3)
    tr_end = pixels.get(x + itemWidth, y, 0)
  } while (out_of_bounds || tl_alpha === 0 || tr_alpha === 0 || tl_red === 196 || tr_end === 196)

  return {x, y}
}

const isInRange = function(target, tl, tr, bl) {
  return tl.x <= target.x && target.x <= tr.x && tl.y <= target.y && target.y <= bl.y
}

const isOverlappingPixels = function(existing, proposed, itemWidth, itemHeight) {
  const aTopLeft = proposed
  const aTopRight = {
    x: proposed.x + itemWidth, 
    y: proposed.y
  }
  const aBottomLeft = {
    x: proposed.x,
    y: proposed.y + itemHeight
  }
  const aBottomRight = {
    x: proposed.x + itemWidth, 
    y: proposed.y + itemHeight
  }
  const bTopLeft = existing
  const bTopRight = {
    x: existing.x + itemWidth,
    y: existing.y
  }
  const bBottomLeft = {
    x: existing.x,
    y: existing.y + itemHeight
  }
  return isInRange(aTopLeft, bTopLeft, bTopRight, bBottomLeft)
    || isInRange(aTopRight, bTopLeft, bTopRight, bBottomLeft)
    || isInRange(aBottomLeft, bTopLeft, bTopRight, bBottomLeft)
    || isInRange(aBottomRight, bTopLeft, bTopRight, bBottomLeft)
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
