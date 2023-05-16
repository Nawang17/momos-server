module.exports = (sequelize, DataTypes) => {
  const notis = sequelize.define("notis", {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  notis.associate = (models) => {
    notis.belongsTo(models.users, {
      as: "user",

      foreignKey: "userId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });

    notis.belongsTo(models.users, {
      as: "targetuser",
      foreignKey: "targetuserId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.posts, {
      foreignKey: "postId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.likes, {
      foreignKey: "likeId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.comments, {
      foreignKey: "commentId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.nestedcomments, {
      foreignKey: "nestedcommentId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.follows, {
      foreignKey: "followid",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.commentlikes, {
      foreignKey: "commentlikeId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.nestedcommentlikes, {
      foreignKey: "nestedcommentlikeId",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };
  return notis;
};
