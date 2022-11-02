module.exports = (sequelize, DataTypes) => {
  const nestedcomments = sequelize.define("nestedcomments", {
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  nestedcomments.associate = (models) => {
    nestedcomments.belongsTo(models.users, {
      as: "user",
      foreignKey: { name: "userId" },
      onDelete: "CASCADE",
    });
    nestedcomments.belongsTo(models.users, {
      as: "repliedtouser",

      foreignKey: "repliedtouserId",
      onDelete: "CASCADE",
    });
    nestedcomments.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
    });
    nestedcomments.belongsTo(models.comments, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
    });
    // comments.hasMany(models.notis, {
    //   foreignKey: "commentId",
    //   onDelete: "CASCADE",
    // });
  };
  return nestedcomments;
};
