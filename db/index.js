const posts = require("./posts");
const comments = require("./comments");
const users = require("./users");
const groups = require("./groups");
const votes = require("./votes");
const permissions = require("./permissions");

module.exports = {
  ...posts,
  ...comments,
  ...users,
  ...groups,
  ...votes,
  ...permissions,
};
