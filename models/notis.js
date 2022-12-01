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
    });

    notis.belongsTo(models.users, {
      as: "targetuser",
      foreignKey: "targetuserId",
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.likes, {
      foreignKey: "likeId",
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.comments, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.nestedcomments, {
      foreignKey: "nestedcommentId",
      onDelete: "CASCADE",
    });
    notis.belongsTo(models.follows, {
      foreignKey: "followid",
      onDelete: "CASCADE",
    });
  };
  return notis;
};
