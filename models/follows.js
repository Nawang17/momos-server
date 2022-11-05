module.exports = (sequelize, DataTypes) => {
  const follows = sequelize.define("follows", {});
  follows.associate = (models) => {
    follows.belongsTo(models.users, {
      as: "follower",
      foreignKey: "followerid",
      onDelete: "CASCADE",
    });
    follows.belongsTo(models.users, {
      as: "following",
      foreignKey: "followingid",
      onDelete: "CASCADE",
    });

    follows.hasMany(models.notis, {
      foreignKey: "followid",
      onDelete: "CASCADE",
    });
    follows.hasMany(models.users, {
      foreignKey: "userid",
      onDelete: "CASCADE",
    });
  };
  return follows;
};
