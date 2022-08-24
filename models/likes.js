module.exports = (sequelize) => {
  const likes = sequelize.define("likes");

  likes.associate = (models) => {
    likes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    likes.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    // likes.hasMany(models.notis, {
    //   foreignKey: "likeId",
    //   onDelete: "CASCADE",
    // });
  };
  return likes;
};
