module.exports = (sequelize) => {
  const nestedcommentlikes = sequelize.define("nestedcommentlikes");

  nestedcommentlikes.associate = (models) => {
    nestedcommentlikes.belongsTo(models.users, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    nestedcommentlikes.belongsTo(models.nestedcomments, {
      foreignKey: "nestedcommentId",
      onDelete: "CASCADE",
    });

    nestedcommentlikes.hasMany(models.notis, {
      foreignKey: "nestedcommentlikeId",
      onDelete: "CASCADE",
    });
  };
  return nestedcommentlikes;
};
