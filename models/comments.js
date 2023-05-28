module.exports = (sequelize, DataTypes) => {
  const comments = sequelize.define("comments", {
    text: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    gif: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });
  comments.associate = (models) => {
    comments.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    comments.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    comments.hasMany(models.nestedcomments, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    comments.hasMany(models.notis, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    comments.hasMany(models.commentlikes, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return comments;
};
