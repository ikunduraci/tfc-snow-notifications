var Base64ToHexConverter = Class.create();
Base64ToHexConverter.prototype = {
  initialize: function() {},

  convert: function(base64) {
    // Convert base64 to binary string
    var binaryString = this.base64ToBinary(base64);

    // Convert binary string to hex
    var hex = this.binaryToHex(binaryString);

    return hex;
  },

  base64ToBinary: function(base64) {
    var binaryString = '';
    var base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    for (var i = 0; i < base64.length; i++) {
      var chars = base64.charAt(i);
      var charIndex = base64Chars.indexOf(chars);
      if (charIndex !== -1) {
        binaryString += this.leftPad(charIndex.toString(2), 6, '0');
      }
    }

    return binaryString;
  },

binaryToHex: function(binary) {
  var hex = '';
  var remainder = binary.length % 4;

  // Pad the binary string to have a multiple of 4 length
  if (remainder !== 0) {
    binary = binary.padEnd(binary.length + 4 - remainder, '0');
  }

  for (var i = 0; i < binary.length; i += 4) {
    var chunk = binary.substr(i, 4);
    var hexChunk = parseInt(chunk, 2).toString(16);
    hex += hexChunk;
  }

  // Remove trailing zero if present
  hex = hex.replace(/0+$/, '');

  return hex;
},

  leftPad: function(str, length, padChar) {
    while (str.length < length) {
      str = padChar + str;
    }
    return str;
  },

  type: 'Base64ToHexConverter'
};
