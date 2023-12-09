const mongoose = require('mongoose');

const globalSchema = new mongoose.Schema({
   guildId:{
    type:String,
    required:true
   },
   raidsArray:Array
});

module.exports = mongoose.model('global', globalSchema);
