module.exports = (sequelize, DataTypes) => {
  const follows = sequelize.define("follows", {});
  follows.associate = (models) => {
    follows.belongsTo(models.users, {
      as: "follower",
      foreignKey: "followerid",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    follows.belongsTo(models.users, {
      as: "following",
      foreignKey: "followingid",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });

    follows.hasMany(models.notis, {
      foreignKey: "followid",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
    follows.hasMany(models.users, {
      foreignKey: "userid",
      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };
  return follows;
};
