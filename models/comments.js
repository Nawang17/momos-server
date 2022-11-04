module.exports = (sequelize, DataTypes) => {
  const comments = sequelize.define("comments", {
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  comments.associate = (models) => {
    comments.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    comments.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    comments.hasMany(models.nestedcomments, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
    });
    comments.hasMany(models.notis, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
    });
  };
  return comments;
};
