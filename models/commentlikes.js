module.exports = (sequelize) => {
  const commentlikes = sequelize.define("commentlikes");

  commentlikes.associate = (models) => {
    commentlikes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    commentlikes.belongsTo(models.comments, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
    });

    commentlikes.hasMany(models.notis, {
      foreignKey: "commentlikeId",
      onDelete: "CASCADE",
    });
  };
  return commentlikes;
};
