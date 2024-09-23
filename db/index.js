const posts = require("./posts");
const users = require("./users");
const groups = require("./groups");
const votes = require("./votes");
const permissions = require("./permissions");

module.exports = {
  ...posts,
  ...users,
  ...groups,
  ...votes,
  ...permissions,
};
