const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('config');
const userLogins = require('../models/UserLogin.model');
const users = require('../models/User.model');

router.post('/', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  users.findOne({ username: username }, function (err, user) {
    if (err) {
      return res.status(400).json({ err: 'Error Creating Room.' });
    }
    if (!user) {
      var user = new userLogins({ username: username, password: password });
      user.save((err) => {
        if (err) {
          return res.status(400).json({ err: 'Error Registering User' });
        }
        var userdata = new users({ username: username });
        userdata.save((errr) => {
          if (errr) {
            return res.status(400).json({ err: 'Error Registering User' });
          } else {
            return res.status(200).json({ msg: 'Registered Successfully' });
          }
        });
      });
      console.log(username);
      console.log(password);
    } else {
      return res.status(200).json({ err: 'UEXIST' });
    }
  });
});
module.exports = router;
