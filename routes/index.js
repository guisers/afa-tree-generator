const testData = require('../test/data') // FOR TESTING

var express = require('express')
var router = express.Router()

/* GET landing page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'AFA Christmas Tree Generator'
  })
})

/* POST generate a tree. */
router.post('/generate', function(req, res, next) {
  res.redirect('/result')
})

/* GET result page. */
router.get('/result', function(req, res, next) {
  res.render('result', {
    title: 'Generated Tree',
    donors: testData.donors
  })
})

module.exports = router
