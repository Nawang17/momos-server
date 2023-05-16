module.exports = (sequelize) => {
  const postquotes = sequelize.define("postquotes");

  postquotes.associate = (models) => {
    postquotes.belongsTo(models.posts, {
      foreignKey: "postId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    postquotes.belongsTo(models.posts, {
      as: "quotescount",

      foreignKey: "quotedPostId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };
  return postquotes;
};
