module.exports = (sequelize) => {
  const likes = sequelize.define("likes");

  likes.associate = (models) => {
    likes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    likes.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    likes.belongsTo(models.notis, {
      foreignKey: "likeId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    // likes.hasMany(models.notis, {
    //   foreignKey: "likeId",
    //   onDelete: "CASCADE",
    // });
  };
  return likes;
};
