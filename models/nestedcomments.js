module.exports = (sequelize, DataTypes) => {
  const nestedcomments = sequelize.define("nestedcomments", {
    text: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    gif: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });
  nestedcomments.associate = (models) => {
    nestedcomments.belongsTo(models.users, {
      as: "user",
      foreignKey: { name: "userId" },
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    nestedcomments.belongsTo(models.users, {
      as: "repliedtouser",

      foreignKey: "repliedtouserId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    nestedcomments.belongsTo(models.posts, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    nestedcomments.belongsTo(models.comments, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    nestedcomments.belongsTo(models.notis, {
      foreignKey: "nestedcommentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
    nestedcomments.hasMany(models.nestedcommentlikes, {
      foreignKey: "nestedcommentId",
      onDelete: "CASCADE",
      foreignKeyConstraint: true,
    });
  };
  return nestedcomments;
};
