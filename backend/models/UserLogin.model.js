const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userLoginSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});
var userLogins = mongoose.model('userLogins', userLoginSchema);
module.exports = userLogins;
