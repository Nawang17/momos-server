module.exports = (sequelize) => {
  const postquotes = sequelize.define("postquotes");

  postquotes.associate = (models) => {
    postquotes.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    postquotes.belongsTo(models.posts, {
      as: "quotescount",

      foreignKey: "quotedPostId",
      onDelete: "CASCADE",
    });
  };
  return postquotes;
};
