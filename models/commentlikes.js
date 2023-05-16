module.exports = (sequelize) => {
  const commentlikes = sequelize.define("commentlikes");

  commentlikes.associate = (models) => {
    commentlikes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    commentlikes.belongsTo(models.comments, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });

    commentlikes.hasMany(models.notis, {
      foreignKey: "commentlikeId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return commentlikes;
};
