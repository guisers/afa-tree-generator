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
  // console.log('Generating tree with the following data:')
  // console.log(res.locals.donors)
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
  var tr_alpha
  var bl_alpha
  var br_alpha
  var mt_alpha
  var ml_alpha
  var mr_alpha
  var mb_alpha
  var out_of_bounds

  do {
    x = getRandom(width)
    y = getRandom(height)
    if (x + itemWidth > width || y + itemHeight > height) {
      out_of_bounds = true
    } else {
      out_of_bounds = false
    }
    // 3 is alpha channel
    tl_alpha = pixels.get(x, y, 3)
    tr_alpha = pixels.get(x + itemWidth, y, 3)
    bl_alpha = pixels.get(x, y + itemHeight, 3)
    br_alpha = pixels.get(x + itemWidth, y + itemHeight, 3)
    mt_alpha = pixels.get(x + Math.floor(itemWidth / 2), y, 3)
    ml_alpha = pixels.get(x, y + Math.floor(itemHeight / 2), 3)
    mr_alpha = pixels.get(x + itemWidth, y + Math.floor(itemHeight / 2), 3)
    mb_alpha = pixels.get(x + Math.floor(itemWidth / 2), y + itemHeight, 3)
  } while (out_of_bounds
    || tl_alpha === 0 || tr_alpha === 0
    || bl_alpha === 0 || br_alpha === 0
    || mt_alpha === 0 || ml_alpha === 0
    || mr_alpha === 0 || mb_alpha === 0
  )

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
  const height = 910
  const width = 600
  const itemWidth = 30
  const itemHeight = 56

  var result
  var count = 0

  do {
    result = getColoredPixel(pixels, width, height, itemWidth, itemHeight)
    count++
  } while (isOverlappingExistingItems(result, positions, itemWidth, itemHeight) && count < 50000)

  if (count >= 50000) {
    throw new Error('Error: There are too many donors and not enough space on the tree.')
  } else {
    // console.log('Count is ' + count)
    return result
  }
}

const positionCalculator = function(req, res, next) {
  var donors = res.locals.donors

  getPixels('public/images/tree_map.png', function(err, pixels) {
    var positions = []
    try {
      donors.forEach(function(donor) {
        const pos = getValidPosition(pixels, positions)
        positions.push(pos)
        donor.x = pos.x
        donor.y = pos.y
        donor.color = getRandom(6)
      })
      console.log('Successfully placed all baubles')
      res.locals.donors = donors
    } catch (e) {
      console.log(e)
      res.locals.donors = null
      res.locals.error = e
    }
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
