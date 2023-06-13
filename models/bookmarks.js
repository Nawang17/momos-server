module.exports = (sequelize) => {
  const bookmarks = sequelize.define("bookmarks");

  bookmarks.associate = (models) => {
    bookmarks.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    bookmarks.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return bookmarks;
};
